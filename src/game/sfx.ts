import { useSettings } from './settings'

/** Tiny square-wave sound effects, and one original jazz bed, synthesised in the browser. No audio files. */

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!useSettings.getState().sound) return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

type Note = { f: number; d: number; at?: number; type?: OscillatorType; v?: number; slide?: number }

function play(notes: Note[]) {
  const ac = audio()
  if (!ac) return
  const now = ac.currentTime
  for (const n of notes) {
    const start = now + (n.at ?? 0)
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = n.type ?? 'square'
    osc.frequency.setValueAtTime(n.f, start)
    if (n.slide) osc.frequency.linearRampToValueAtTime(n.slide, start + n.d)
    const v = n.v ?? 0.06
    gain.gain.setValueAtTime(v, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.d)
    osc.connect(gain).connect(ac.destination)
    osc.start(start)
    osc.stop(start + n.d + 0.02)
  }
}

let lastBump = 0
let lastBlip = 0

export const sfx = {
  cursor: () => play([{ f: 1320, d: 0.03, v: 0.04 }]),
  select: () => play([{ f: 988, d: 0.04 }, { f: 1319, d: 0.06, at: 0.04 }]),
  back: () => play([{ f: 660, d: 0.05 }, { f: 440, d: 0.06, at: 0.04 }]),
  blip: () => {
    const now = performance.now()
    if (now - lastBlip < 55) return
    lastBlip = now
    play([{ f: 1760, d: 0.018, v: 0.025 }])
  },
  bump: () => {
    const now = performance.now()
    if (now - lastBump < 260) return
    lastBump = now
    play([{ f: 140, d: 0.08, type: 'triangle', v: 0.12, slide: 70 }])
  },
  mark: () =>
    play([
      { f: 784, d: 0.07 },
      { f: 988, d: 0.07, at: 0.07 },
      { f: 1319, d: 0.16, at: 0.14 },
    ]),
  trap: () => play([{ f: 220, d: 0.12, type: 'sawtooth', v: 0.05 }, { f: 175, d: 0.18, at: 0.1, type: 'sawtooth', v: 0.05 }]),
  /** One fetal heartbeat through the Doppler: a soft whoosh. */
  doppler: () => play([{ f: 190, d: 0.11, type: 'triangle', v: 0.09, slide: 110 }]),
  door: () => play([{ f: 330, d: 0.18, type: 'triangle', v: 0.1, slide: 660 }]),
  battle: () =>
    play([
      { f: 523, d: 0.06 },
      { f: 659, d: 0.06, at: 0.06 },
      { f: 784, d: 0.06, at: 0.12 },
      { f: 1047, d: 0.14, at: 0.18 },
    ]),
  fanfare: () =>
    play([
      { f: 523, d: 0.12 },
      { f: 523, d: 0.08, at: 0.14 },
      { f: 523, d: 0.08, at: 0.24 },
      { f: 698, d: 0.3, at: 0.34 },
      { f: 880, d: 0.12, at: 0.66 },
      { f: 784, d: 0.12, at: 0.8 },
      { f: 1047, d: 0.5, at: 0.94 },
    ]),
}

/** Continuous drill whine. Pitch drops when the tip gives into marrow. */
let drillOsc: OscillatorNode | null = null
let drillGain: GainNode | null = null

export const drill = {
  start: () => {
    const ac = audio()
    if (!ac || drillOsc) return
    drillOsc = ac.createOscillator()
    drillGain = ac.createGain()
    drillOsc.type = 'sawtooth'
    drillOsc.frequency.setValueAtTime(220, ac.currentTime)
    drillGain.gain.setValueAtTime(0.035, ac.currentTime)
    drillOsc.connect(drillGain).connect(ac.destination)
    drillOsc.start()
  },
  pitch: (hz: number) => {
    if (drillOsc && ctx) drillOsc.frequency.setTargetAtTime(hz, ctx.currentTime, 0.03)
  },
  stop: () => {
    try {
      drillOsc?.stop()
    } catch {
      // already stopped
    }
    drillOsc = null
    drillGain = null
  },
}

/**
 * A quiet swing chorus in B-flat, about 92 bpm. Written for this game: walking bass, soft chords, a sparse
 * melody, brushes on 2 and 4. It is not a recording of anyone else's tune.
 */
const BPM = 92
const BEAT = 60 / BPM
const LOOP = 4 * 4 * BEAT
const BASS = [
  [116.54, 146.83, 174.61, 207.65],
  [77.78, 98, 116.54, 146.83],
  [65.41, 77.78, 98, 116.54],
  [87.31, 110, 130.81, 155.56],
]
const CHORDS = [
  [233.08, 293.66, 349.23, 466.16],
  [155.56, 196, 233.08, 349.23],
  [130.81, 155.56, 196, 233.08],
  [174.61, 220, 261.63, 349.23],
]
const MELODY = [
  [349.23, 415.3, 466.16, 0],
  [587.33, 523.25, 466.16, 392],
  [392, 466.16, 523.25, 0],
  [440, 392, 349.23, 349.23],
]

let jazzLive = false
let jazzTimer: ReturnType<typeof setTimeout> | null = null
let jazzNext = 0
let jazzMaster: GainNode | null = null
let jazzNodes: AudioScheduledSourceNode[] = []
let brushNoise: AudioBuffer | null = null

function tone(ac: AudioContext, dest: AudioNode, when: number, freq: number, dur: number, type: OscillatorType, vol: number) {
  if (freq <= 0) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, when)
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(vol, when + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(dur, 0.06))
  osc.connect(gain).connect(dest)
  osc.start(when)
  osc.stop(when + dur + 0.05)
  jazzNodes.push(osc)
}

function brush(ac: AudioContext, dest: AudioNode, when: number) {
  if (!brushNoise) {
    brushNoise = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.2), ac.sampleRate)
    const data = brushNoise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const src = ac.createBufferSource()
  src.buffer = brushNoise
  const filter = ac.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 5000
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.02, when)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.05)
  src.connect(filter).connect(gain).connect(dest)
  src.start(when)
  src.stop(when + 0.06)
  jazzNodes.push(src)
}

function scheduleJazz() {
  if (!jazzLive || !ctx || !jazzMaster) return
  const start = jazzNext > ctx.currentTime ? jazzNext : ctx.currentTime + 0.08
  jazzNodes = []
  for (let bar = 0; bar < 4; bar++) {
    const barAt = start + bar * 4 * BEAT
    for (const freq of CHORDS[bar]) tone(ctx, jazzMaster, barAt, freq, BEAT * 2.6, 'sine', 0.007)
    for (let beat = 0; beat < 4; beat++) {
      const when = barAt + beat * BEAT
      tone(ctx, jazzMaster, when, BASS[bar][beat], BEAT * 0.9, 'triangle', 0.04)
      tone(ctx, jazzMaster, when, MELODY[bar][beat], BEAT * 0.8, 'sine', 0.016)
    }
    brush(ctx, jazzMaster, barAt + BEAT)
    brush(ctx, jazzMaster, barAt + 3 * BEAT)
  }
  jazzNext = start + LOOP
  jazzTimer = setTimeout(scheduleJazz, Math.max(200, (jazzNext - ctx.currentTime - 0.35) * 1000))
}

/** Start the bed after a click or a key. Does nothing while sound is off, and does not stack. */
export function startJazz() {
  const ac = audio()
  if (!ac || jazzLive) return
  jazzLive = true
  jazzMaster = ac.createGain()
  jazzMaster.gain.setValueAtTime(0.85, ac.currentTime)
  jazzMaster.connect(ac.destination)
  jazzNext = 0
  scheduleJazz()
}

/** Fade the bed out. The sound toggle calls this. */
export function stopJazz() {
  jazzLive = false
  if (jazzTimer) clearTimeout(jazzTimer)
  jazzTimer = null
  jazzNext = 0
  try {
    if (jazzMaster && ctx) jazzMaster.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08)
  } catch {
    // The context may already be closed.
  }
  for (const node of jazzNodes) {
    try {
      node.stop()
    } catch {
      // Already stopped.
    }
  }
  jazzNodes = []
  jazzMaster = null
}

/** Short phone vibration, where supported. Silent no-op elsewhere. */
export function buzz(ms: number | number[]) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    // no vibration API
  }
}
