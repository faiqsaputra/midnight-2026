import { trigger2026 } from "./three/scene"

/* ===============================
   ⏰ TARGET TIME
================================ */
const target = new Date("January 1, 2026 00:00:00").getTime()

/* ===============================
   📦 ELEMENTS
================================ */
const elDays = document.getElementById("days")
const elHours = document.getElementById("hours")
const elMinutes = document.getElementById("minutes")
const elSeconds = document.getElementById("seconds")
const countdown = document.getElementById("countdown")
const yearDigit = document.getElementById("year-digit")

let finished = false

/* ===============================
   🔔 AUDIO
================================ */
const bell = new Audio("/new-year.mp3")
bell.volume = 0.85

/* ===============================
   ✨ VISUAL EFFECTS
================================ */
function pulse() {
  countdown.classList.remove("pulse")
  void countdown.offsetWidth
  countdown.classList.add("pulse")
}

function electricTick() {
  countdown.style.filter =
    "drop-shadow(0 0 20px rgba(212,175,55,.9))"
  setTimeout(() => {
    countdown.style.filter = ""
  }, 120)
}

/* ===============================
   🎆 FINAL SEQUENCE
================================ */
function finalMoment() {
  finished = true

  /* ⏹ STOP AT ZERO */
  elDays.textContent = "00"
  elHours.textContent = "00"
  elMinutes.textContent = "00"
  elSeconds.textContent = "00"

  countdown.classList.add("pulse-gold")

  /* 🔢 2025 → 2026 DIGIT FLIP */
  if (yearDigit) {
    yearDigit.classList.add("flip-out")

    setTimeout(() => {
      yearDigit.textContent = "6"
      yearDigit.classList.remove("flip-out")
      yearDigit.classList.add("flip-in")
    }, 900)
  }

  /* 🎥 THREE.JS CINEMATIC */
  trigger2026()

  /* 🔔 BELL */
  bell.currentTime = 0
  bell.play()

  /* ✨ FLASH */
  document.body.style.background =
    "radial-gradient(circle at center, rgba(212,175,55,.45), #000 70%)"
}

/* ===============================
   🔁 UPDATE LOOP
================================ */
function updateCountdown() {
  const now = Date.now()
  const diff = target - now

  /* ===== MIDNIGHT ===== */
  if (diff <= 0 && !finished) {
    finalMoment()
    return
  }
  if (diff <= 0) return

  /* ===== TIME CALC ===== */
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)

  elDays.textContent = String(days).padStart(2, "0")
  elHours.textContent = String(hours).padStart(2, "0")
  elMinutes.textContent = String(minutes).padStart(2, "0")
  elSeconds.textContent = String(seconds).padStart(2, "0")

  /* ===== EFFECTS ===== */
  pulse()

  // ⚡ 10 seconds tension
  if (diff <= 10_000) {
    electricTick()
    countdown.style.transform = "scale(1.03)"
  } else {
    countdown.style.transform = "scale(1)"
  }
}

/* ===============================
   ⏱ DRIFT-FREE TIMER
================================ */
function startTimer() {
  updateCountdown()
  setTimeout(startTimer, 1000 - (Date.now() % 1000))
}

startTimer()
