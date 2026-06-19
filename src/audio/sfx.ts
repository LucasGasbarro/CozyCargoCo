/**
 * Tiny procedural sound-effects manager (BasePrompt §M8). All cues are synthesised live with the
 * Web Audio API — no audio files, no licensing to track, matching our procedural canvas art.
 *
 * Design: gentle and low-pressure (this is a cozy game). The AudioContext is created lazily on the
 * first cue and resumed on user gesture (browsers block autoplay until then). A mute toggle is
 * persisted to localStorage. Safe to call in non-browser/test environments — it simply no-ops.
 */

const MUTE_KEY = 'cozy-cargo-co/muted'

let ctx: AudioContext | null = null
let muted = loadMuted()

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

function persistMuted(value: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0')
  } catch {
    // ignore (private mode / no storage)
  }
}

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext }

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext
    if (!Ctor) return null
    try {
      ctx = new Ctor()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface ToneOptions {
  type?: OscillatorType
  /** Peak gain (kept low — these are soft cues). */
  gain?: number
}

/** Schedule a single tone at `start` (seconds, AudioContext time) with a quick attack/decay. */
function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  durationSec: number,
  { type = 'sine', gain = 0.07 }: ToneOptions = {},
): void {
  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)

  env.gain.setValueAtTime(0, start)
  env.gain.linearRampToValueAtTime(gain, start + 0.008)
  env.gain.exponentialRampToValueAtTime(0.0001, start + durationSec)

  osc.connect(env)
  env.connect(ac.destination)
  osc.start(start)
  osc.stop(start + durationSec + 0.02)
}

/** Play a sequence of notes (frequency + length) back-to-back. */
function sequence(
  key: string,
  notes: { freq: number; dur: number; type?: OscillatorType; gain?: number }[],
): void {
  if (muted) return
  if (recentlyPlayed(key)) return // de-dupe rapid repeats (e.g. React StrictMode double-invoke)
  const ac = getContext()
  if (!ac) return
  let t = ac.currentTime
  for (const n of notes) {
    tone(ac, n.freq, t, n.dur, { type: n.type, gain: n.gain })
    t += n.dur * 0.85
  }
}

const lastPlayed = new Map<string, number>()
function recentlyPlayed(key: string, gapMs = 60): boolean {
  const now = Date.now()
  const prev = lastPlayed.get(key) ?? 0
  lastPlayed.set(key, now)
  return now - prev < gapMs
}

/** Soft UI tap — used for selections and dispatch. */
export function playClick(): void {
  sequence('click', [{ freq: 520, dur: 0.07, type: 'triangle', gain: 0.05 }])
}

/** Gentle two-note chime — a train has arrived. */
export function playChime(): void {
  sequence('chime', [
    { freq: 660, dur: 0.12, type: 'sine', gain: 0.06 },
    { freq: 990, dur: 0.18, type: 'sine', gain: 0.06 },
  ])
}

/** Bright little arpeggio — coins collected. */
export function playCoin(): void {
  sequence('coin', [
    { freq: 880, dur: 0.08, type: 'square', gain: 0.04 },
    { freq: 1318, dur: 0.14, type: 'square', gain: 0.04 },
  ])
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(value: boolean): void {
  muted = value
  persistMuted(value)
}

export function toggleMuted(): boolean {
  setMuted(!muted)
  return muted
}
