import DecibelMeter from 'decibel-meter'

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

function resetDbMeter(dbMeter) {
  const checkTitle = document.getElementById('check-title')
  checkTitle.innerText = `Latest collection (${delayCheck/ intervalOfChecks} checks every ${delayCheck/1000}s)`
  dbMeter?.disconnect()
  dbMeter = new DecibelMeter
  dbMeter.listenTo(0, (dB, percent, value) => {
    dbMeterData = {
      dB: dB,
      percent: percent,
      value: value
    }
  })

  dbMeter.on('disconnect', () => {
    clearInterval(intervalOfChecksLoop)
    clearInterval(delayCheckLoop)
  })

  dbMeter.on('connect', ()=>{
    intervalOfChecksLoop = setInterval(() => {
      const { dB, percent, value } = dbMeterData
      const dbDiff = Math.abs(Math.round(dB - prevDb))
      soundHistory.push(Math.abs(Math.round(dB)))

      // dbMeterDisplay.innerHTML = `<p>dB: ${dB}</p>
      //                             <p>percent: ${percent}</p>
      //                             <p>value: ${value}</p>`
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
    }, intervalOfChecks * 3);

    delayCheckLoop = setInterval(() => {
      const pastFiveSec = soundHistory.slice(-1 * (delayCheck / intervalOfChecks))
      const dBAverage = pastFiveSec.reduce((a,b)=>a+b) / (delayCheck / intervalOfChecks)
      // soundDetected = dBAverage < 94.5
      soundDetected = dBAverage < dBlimit

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

      visualDisplay.innerHTML = pastFiveSec.map(num=>`<div style="height:${num}%"></div>`).join('')

      const message = soundDetected ? `talking` : `silent`
      dbMeterDisplay.innerHTML = `average: ${dBAverage}dB [${message}]`
      // console.log(message, soundDetected, dBAverage)
    }, delayCheck);
  })
  return dbMeter
}

let dbMeter = resetDbMeter()

const intervalInput = document.getElementById('interval')
const intervalDisplay = document.getElementById('intervalDisplay')
intervalInput.addEventListener('change', (e)=>{
  intervalOfChecks = e.currentTarget.value
  dbMeter = resetDbMeter(dbMeter)
})

intervalInput.addEventListener('input', (e)=>{
  intervalDisplay.innerHTML = e.currentTarget.value
})

const checkInput = document.getElementById('check')
const checkDisplay = document.getElementById('checkDisplay')
checkInput.addEventListener('change', (e)=>{
  checkDisplay.innerHTML = e.currentTarget.value
  delayCheck = e.currentTarget.value
  dbMeter = resetDbMeter(dbMeter)
})

checkInput.addEventListener('input', (e)=>{
  checkDisplay.innerHTML = e.currentTarget.value
})

const dBlimitInput = document.getElementById('dBlimit')
const dBlimitDisplay = document.getElementById('dBlimitDisplay')
dBlimitInput.addEventListener('change', (e)=>{
  dBlimitDisplay.innerHTML = e.currentTarget.value
  dBlimit = e.currentTarget.value
  dbMeter = resetDbMeter(dbMeter)
})

dBlimitInput.addEventListener('input', (e)=>{
  dBlimitDisplay.innerHTML = e.currentTarget.value
})