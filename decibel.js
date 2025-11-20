import DecibelMeter from 'decibel-meter'

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream)=>{    
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
    
    async function resetDbMeter(dbMeter) {
      const checkTitle = document.getElementById('check-title')
      checkTitle.innerHTML = `Latest collection <small>(${delayCheck/ intervalOfChecks} checks every ${delayCheck/1000}s)</small>`
      dbMeter?.disconnect()
      dbMeter = new DecibelMeter
      const sources = await dbMeter.sources
      const sourcesNames = sources.map((src,index)=>`<p>[${index}] ${src.label}</p>`).join('')
      document.body.insertAdjacentHTML('beforeend', '<h3>Sources</h3>' + sourcesNames)
      dbMeter.listenTo(1, (dB, percent, value) => {
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
            realTime.setAttribute('data-height', size - 25)
            setTimeout(() => {
              realTime.setAttribute('style', `height: ${size}px; width: ${size}px`)
            }, intervalOfChecks);
          } else {
            realTime.removeAttribute('style')
          }
          prevDb = dB
        }, intervalOfChecks);
        
        // updating average
        delayCheckLoop = setInterval(() => {
          const pastFiveSec = soundHistory.slice(-1 * (delayCheck / intervalOfChecks))
          const dBAverage = pastFiveSec.reduce((a,b)=>a+b) / (delayCheck / intervalOfChecks)
          // soundDetected = dBAverage < 94.5
          console.log(dBAverage)
          soundDetected = dBAverage < dBlimit
    
          // updating color
          if (soundDetected) {
            realTime.classList.remove('silent')
            realTime.classList.add('talking')
            bg.classList.remove('silent')
            bg.classList.add('talking')
          } else {
            realTime.classList.remove('talking')
            realTime.classList.add('silent')
            bg.classList.remove('talking')
            bg.classList.add('silent')
          }
    
          // adding bars
          visualDisplay.innerHTML = pastFiveSec.map(num=>`<div style="height:${num}%"></div>`).join('')
    
          const message = soundDetected ? `talking` : `silent`
          dbMeterDisplay.innerHTML = `average: ${dBAverage}dB [${message}]`
          // console.log(message, soundDetected, dBAverage)
        }, delayCheck);
      })
      return dbMeter
    }
    
    let dbMeter = resetDbMeter()
    // update if interval input changes
    const intervalInput = document.getElementById('interval')
    intervalInput.value = intervalOfChecks
    const intervalDisplay = document.getElementById('intervalDisplay')
    intervalDisplay.innerHTML = intervalOfChecks + " <small>msec</small>"
    intervalInput.addEventListener('change', (e)=>{
      intervalOfChecks = e.currentTarget.value
      dbMeter = resetDbMeter(dbMeter)
    })
    
    intervalInput.addEventListener('input', (e)=>{
      intervalDisplay.innerHTML = e.currentTarget.value + " <small>msec</small>"
    })
    // update if check input changes
    const checkInput = document.getElementById('check')
    checkInput.value = delayCheck
    const checkDisplay = document.getElementById('checkDisplay')
    checkInput.addEventListener('change', (e)=>{
      delayCheck = e.currentTarget.value
      dbMeter = resetDbMeter(dbMeter)
    })
    
    checkInput.addEventListener('input', (e)=>{
      checkDisplay.innerHTML = e.currentTarget.value + " <small>msec</small>"
    })

    // update if db limit input changes
    const dBlimitInput = document.getElementById('dBlimit')
    dBlimitInput.value = dBlimit
    const dBlimitDisplay = document.getElementById('dBlimitDisplay')
    dBlimitInput.addEventListener('change', (e)=>{
      dBlimit = e.currentTarget.value
      dbMeter = resetDbMeter(dbMeter)
    })
    
    dBlimitInput.addEventListener('input', (e)=>{
      dBlimitDisplay.innerHTML = e.currentTarget.value + " <small>dB</small>"
    })
  })
}
