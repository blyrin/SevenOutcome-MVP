import { G } from './state'
import { getCurrentCase } from './cases/caseManager'

export interface AudioContextContainer {
  ctx: AudioContext | null
  bgm: HTMLAudioElement | null
  amb: HTMLAudioElement | null
  voice: HTMLAudioElement | null
}

export const AU: AudioContextContainer = { ctx: null, bgm: null, amb: null, voice: null }

let bgm: HTMLAudioElement | null = null
let currentBgmUrl = ''
let fadeTimer: number | null = null
let voiceAudio: HTMLAudioElement | null = null

function getCaseBgmUrl(): string {
  const curCase = getCurrentCase()
  return curCase?.audio?.bgm || `${ import.meta.env.BASE_URL }cases/blacksmith/audio/bgm.mp3`
}

function fadeBgm(target: number, duration = 1200): void {
  if (!bgm) {
    return
  }
  if (fadeTimer !== null) {
    cancelAnimationFrame(fadeTimer)
  }
  const startVol = bgm.volume
  const startTime = performance.now()
  function step(now: number): void {
    if (!bgm) return
    const elapsed = now - startTime
    const progress = Math.min(1, elapsed / duration)
    bgm.volume = Math.max(0, Math.min(1, startVol + (target - startVol) * progress))
    if (progress < 1) {
      fadeTimer = requestAnimationFrame(step)
    } else {
      fadeTimer = null
      if (target === 0) {
        bgm.pause()
      }
    }
  }
  fadeTimer = requestAnimationFrame(step)
}

export function auInit(): void {
  if (!AU.ctx) {
    try {
      const AudioCtx = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        AU.ctx = new AudioCtx()
      }
    } catch (e) {}
  }
  if (AU.ctx && AU.ctx.state === 'suspended') {
    AU.ctx.resume().then(console.error)
  }
  startAmbient()
}

export function playBgm(url?: string): void {
  const targetUrl = url || getCaseBgmUrl()
  if (bgm && currentBgmUrl === targetUrl) {
    if (G.musicOn && bgm.paused) {
      bgm.play().then(() => fadeBgm(0.42, 1000)).catch(() => {})
    }
    return
  }
  currentBgmUrl = targetUrl
  if (bgm) {
    fadeBgm(0, 500)
    setTimeout(() => {
      if (!bgm) return
      bgm.pause()
      bgm.src = encodeURI(targetUrl)
      if (G.musicOn) {
        bgm.play().then(() => fadeBgm(0.42, 1500)).catch(() => {})
      }
    }, 520)
  } else {
    bgm = new Audio(encodeURI(targetUrl))
    bgm.loop = true
    bgm.volume = 0
    AU.bgm = bgm
    AU.amb = bgm
    if (G.musicOn) {
      bgm.play().then(() => fadeBgm(0.42, 2000)).catch(() => {})
    }
  }
}

export function startAmbient(): void {
  playBgm(getCaseBgmUrl())
}

export function setMusic(on: boolean): void {
  G.musicOn = on
  if (!bgm) {
    return
  }
  if (on) {
    bgm.play().then(() => {
      fadeBgm(isVoicePlaying() ? 0.08 : 0.42, 1000)
    }).catch(() => {})
  } else {
    fadeBgm(0, 1000)
  }
}

export function playVoice(url: string | null): void {
  stopVoice()
  if (!G.voiceOn || !url) {
    return
  }
  voiceAudio = new Audio(url)
  voiceAudio.volume = 1.0
  AU.voice = voiceAudio

  if (bgm && G.musicOn) {
    fadeBgm(0.08, 300)
  }

  voiceAudio.onended = () => {
    if (bgm && G.musicOn) {
      fadeBgm(0.42, 600)
    }
  }

  voiceAudio.onerror = () => {
    if (bgm && G.musicOn) {
      fadeBgm(0.42, 400)
    }
  }

  voiceAudio.play().catch(() => {})
}

export function stopVoice(): void {
  if (voiceAudio) {
    voiceAudio.pause()
    voiceAudio.currentTime = 0
    voiceAudio = null
    AU.voice = null
    if (bgm && G.musicOn) {
      fadeBgm(0.42, 500)
    }
  }
}

export function isVoicePlaying(): boolean {
  return !!voiceAudio && !voiceAudio.paused && !voiceAudio.ended
}

export function setVoice(on: boolean): void {
  G.voiceOn = on
  if (!on) {
    stopVoice()
  }
}

export function beep(f: number, dur: number, type?: OscillatorType, vol?: number, slide?: number): void {
  if (!AU.ctx) {
    return
  }
  const c = AU.ctx
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type || 'sine'
  o.frequency.value = f
  if (slide) {
    o.frequency.linearRampToValueAtTime(f + slide, c.currentTime + dur)
  }
  g.gain.value = vol || .08
  g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + dur)
  o.connect(g)
  g.connect(c.destination)
  o.start()
  o.stop(c.currentTime + dur)
}

export function sfx(k: string): void {
  if (!AU.ctx) {
    return
  }
  if (k === 'click') {
    beep(700, .06, 'triangle', .05)
  }
  if (k === 'pickup') {
    beep(520, .09, 'triangle', .08)
    setTimeout(() => beep(780, .12, 'triangle', .08), 90)
  }
  if (k === 'clue') {
    beep(440, .1, 'sine', .09)
    setTimeout(() => beep(660, .14, 'sine', .09), 110)
    setTimeout(() => beep(880, .2, 'sine', .07), 230)
  }
  if (k === 'check') {
    beep(600, .08, 'square', .05)
    setTimeout(() => beep(900, .08, 'square', .05), 90)
    setTimeout(() => beep(1200, .16, 'square', .05), 180)
  }
  if (k === 'fail') {
    beep(220, .25, 'sawtooth', .05, -80)
  }
  if (k === 'success') {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .22, 'sine', .08), i * 130))
  }
  if (k === 'levelup') {
    [392, 523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, .3, 'triangle', .09), i * 110))
  }
  if (k === 'verdict') {
    beep(98, .9, 'sine', .12)
    setTimeout(() => beep(147, .9, 'sine', .1), 200)
  }
  if (k === 'tick') {
    beep(1600, .015, 'square', .012)
  }
}
