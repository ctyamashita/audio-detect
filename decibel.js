import DecibelMeter from 'decibel-meter'
import VAD from "vad-web"

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(async(stream)=>{
    const sourceInput = document.getElementById('source')
    const dbMeterDisplay = document.querySelector('#db-meter')
    const visualDisplay = document.getElementById('display')
    const realTime = document.getElementById('real-time')
    const height = realTime.getBoundingClientRect().height
    const bg = document.getElementById('bg')
    
    let dbMeterData
    let prevDb = -100
    let soundDetected = false
    let soundHistory = []
    
    let delayCheck = 5000
    let dBlimit = 90
    let delayCheckLoop
    let intervalOfChecks = 100
    let intervalOfChecksLoop
    let sourceIndex = 0
    
    function resetDbMeter(dbMeter) {
      const checkTitle = document.getElementById('check-title')
      checkTitle.innerHTML = `Db Meter <small>(${delayCheck/ intervalOfChecks} checks every ${delayCheck/1000}s)</small>`
      dbMeter?.disconnect()
      dbMeter = new DecibelMeter
      dbMeter.listenTo(sourceIndex, (dB, percent, value) => {
        dbMeterData = { dB: dB, percent: percent, value: value }
      })
    
      // clearing loops when disconnect
      dbMeter.on('disconnect', () => {
        clearInterval(intervalOfChecksLoop)
        clearInterval(delayCheckLoop)
      })
    
      dbMeter.on('connect', ()=>{
        // collecting dB measurements
        intervalOfChecksLoop = setInterval(() => {
          const { dB } = dbMeterData
          const dbDiff = Math.abs(Math.round(dB - prevDb))
          soundHistory.push(Math.abs(Math.round(dB)))
    
          // for circle animation
          const size = Math.round(((dbDiff / height) + 1) * height)
          if (soundDetected) {
            realTime.setAttribute('data-height', size - 10)
            realTime.classList.remove('silent')
            realTime.classList.add('talking')
            bg.classList.remove('silent')
            bg.classList.add('talking')
            setTimeout(() => {
              realTime.setAttribute('style', `height: ${size}px; width: ${size}px`)
            }, intervalOfChecks);
          } else {
            realTime.removeAttribute('style')
            realTime.classList.remove('talking')
            realTime.classList.add('silent')
            bg.classList.remove('talking')
            bg.classList.add('silent')
          }

          prevDb = dB
        }, intervalOfChecks);
        
        // updating average
        delayCheckLoop = setInterval(() => {
          const pastFiveSec = soundHistory.slice(-1 * (delayCheck / intervalOfChecks))
          const dBAverage = pastFiveSec.reduce((a,b)=>a+b) / (delayCheck / intervalOfChecks)
          // soundDetected = dBAverage < 94.5
          // console.log(dBAverage, soundDetected)
          // soundDetected = dBAverage < dBlimit
    
          // adding bars
          visualDisplay.innerHTML = pastFiveSec.map(num=>`<div style="height:${100 - num}%"></div>`).join('')
    
          // const message = soundDetected ? `talking` : `silent`
          dbMeterDisplay.innerHTML = `average: ${dBAverage}dB`
          // console.log(message, soundDetected, dBAverage)
        }, delayCheck);
      })
      return dbMeter
    }
    
    let dbMeter = resetDbMeter()
    const sources = await dbMeter.sources
    const sourcesOptions = sources.map((src,index)=>`<option value="${index}">${src.label}</option>`).join('')
    sourceInput.value = sourceIndex
    sourceInput.innerHTML = sourcesOptions
    // update if interval input changes
    const intervalInput = document.getElementById('interval')
    intervalInput.value = intervalOfChecks
    const intervalDisplay = document.getElementById('intervalDisplay')
    intervalDisplay.innerHTML = intervalOfChecks + " <small>msec</small>"
    intervalInput.addEventListener('change', (e) => {
      intervalOfChecks = e.currentTarget.value
      dbMeter = resetDbMeter()
    })
    
    intervalInput.addEventListener('input', (e) => {
      intervalDisplay.innerHTML = e.currentTarget.value + " <small>msec</small>"
    })
    // update if check input changes
    const checkInput = document.getElementById('check')
    checkInput.value = delayCheck
    const checkDisplay = document.getElementById('checkDisplay')
    checkInput.addEventListener('change', (e) => {
      delayCheck = e.currentTarget.value
      dbMeter = resetDbMeter()
    })
    
    checkInput.addEventListener('input', (e) => {
      checkDisplay.innerHTML = e.currentTarget.value + " <small>msec</small>"
    })

    sourceInput.addEventListener('change', (e) => {
      sourceIndex = Number(e.currentTarget.value)
      dbMeter = resetDbMeter()
    })

    const myvad = await VAD.MicVAD.new({
      onSpeechRealStart: () => {
        console.log('talking')
        soundDetected = true
      },
      onSpeechEnd: (audio) => {
        // do something with `audio` (Float32Array of audio samples at sample rate 16000)...
        console.log('stopped talking')
        soundDetected = false
        //   if (!soundDetected) {
        //     console.log('silent for 5 sec')
        //   }
        // }, 3000);
      },
      onnxWASMBasePath:
        "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
      baseAssetPath:
        "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/",
    })

    myvad.start()
  })
}
