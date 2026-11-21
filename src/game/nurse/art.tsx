/**
 * Diagrams for the nurse bench: the signs at the vulva, and the cord measured from the umbilicus.
 */
import { useRef } from 'react'
import { toLocal } from '../bench/kit'
import { CLAMP_PICTURE, MIN_CLAMP_CM, cmAt, type NurseRun } from './model'

const FONT = 'Press Start 2P, monospace'
const INK = '#2c2416'
const SKIN = '#e8b494'
const SKIN_EDGE = '#8a5238'
const HAIR = '#3d2c22'
const CORD = '#f4f6fb'
const CORD_EDGE = '#8a93a8'
const MARK = '#1d6b45'
const BAD = '#9a1020'

export function LookPicture({ run, onSign }: { run: NurseRun; onSign: (sign: 'crowning' | 'perineum' | 'anus' | 'push') => void }) {
  const hot = (on: boolean) => (on ? MARK : INK)
  return (
    <svg viewBox="0 0 240 188" className="io-figure mx-auto block w-full max-w-[360px] select-none" data-testid="nurse-picture">
      <rect width="240" height="188" fill="#f4f0e4" />
      <text x="12" y="16" fontFamily={FONT} fontSize="6" fill={INK}>
        WHAT YOU CAN SEE
      </text>
      <path d="M40 40 Q70 28 100 48 Q118 70 108 118 Q70 132 48 110 Q28 80 40 40 Z" fill={SKIN} stroke={SKIN_EDGE} strokeWidth="1.2" />
      <path d="M150 40 Q180 28 206 52 Q214 86 188 116 Q150 128 132 100 Q124 70 150 40 Z" fill={SKIN} stroke={SKIN_EDGE} strokeWidth="1.2" />
      <ellipse cx="120" cy="78" rx="28" ry="34" fill="#c4626a" stroke={hot(run.perineum)} strokeWidth={run.perineum ? 2.4 : 1.2} onPointerDown={() => onSign('perineum')} />
      <ellipse cx="120" cy="86" rx="16" ry="10" fill="#e8b494" stroke={SKIN_EDGE} strokeWidth="0.8" />
      <circle cx="120" cy="62" r="16" fill="#c99a88" stroke={hot(run.crowning)} strokeWidth={run.crowning ? 2.6 : 1.2} onPointerDown={() => onSign('crowning')} />
      <path d="M106 58 Q120 46 134 58 Q120 52 106 58 Z" fill={HAIR} />
      <ellipse cx="120" cy="118" rx="7" ry="5" fill="#a86858" stroke={hot(run.anus)} strokeWidth={run.anus ? 2.4 : 1} onPointerDown={() => onSign('anus')} />
      <text x="78" y="46" fontFamily={FONT} fontSize="5" fill={hot(run.crowning)}>
        HEAD
      </text>
      <text x="154" y="96" fontFamily={FONT} fontSize="5" fill={hot(run.perineum)}>
        PERINEUM
      </text>
      <text x="136" y="132" fontFamily={FONT} fontSize="5" fill={hot(run.anus)}>
        ANUS
      </text>
      <path d="M8 168 Q8 150 28 150 L212 150 Q228 150 228 164 L228 176 Q228 184 212 184 L28 184 Q8 184 8 168 Z" fill={run.push ? '#e5f5df' : '#fff'} stroke={hot(run.push)} strokeWidth="1.2" onPointerDown={() => onSign('push')} />
      <text x="16" y="166" fontFamily={FONT} fontSize="5" fill={hot(run.push)} onPointerDown={() => onSign('push')}>
        MRS LAI
      </text>
      <text x="16" y="178" fontFamily={FONT} fontSize="5.5" fill={hot(run.push)} onPointerDown={() => onSign('push')}>
        “I HAVE TO PUSH”
      </text>
    </svg>
  )
}

export function ClampPicture({ run, onPick }: { run: NurseRun; onPick: (cm: number) => void }) {
  const svg = useRef<SVGSVGElement>(null)
  const p = CLAMP_PICTURE
  const xAt = (cm: number) => p.umbilicusX + cm * p.pxPerCm
  const placed = run.clampCm
  const close = placed !== null && placed < MIN_CLAMP_CM
  return (
    <div className="mx-auto max-w-[360px]" style={{ touchAction: 'none' }}>
      <svg
        ref={svg}
        viewBox={`0 0 ${p.w} ${p.h}`}
        className="io-figure block h-auto w-full select-none"
        data-testid="nurse-clamp-picture"
        onPointerDown={(e) => {
          const pt = toLocal(svg.current, e)
          if (!pt) return
          const cm = cmAt(pt.x, pt.y)
          if (cm === null) return
          onPick(cm)
        }}
      >
        <rect width={p.w} height={p.h} fill="#f4f0e4" />
        <ellipse cx="28" cy={p.cordY} rx="22" ry="28" fill={SKIN} stroke={SKIN_EDGE} strokeWidth="1.2" />
        <circle cx={p.umbilicusX} cy={p.cordY} r="5" fill="#c4626a" stroke={SKIN_EDGE} strokeWidth="1" />
        <text x="8" y="18" fontFamily={FONT} fontSize="5" fill={INK}>
          UMBILICUS
        </text>
        <path d={`M${p.umbilicusX} ${p.cordY - 8} H220 Q228 ${p.cordY} 220 ${p.cordY + 8} H${p.umbilicusX} Z`} fill={CORD} stroke={CORD_EDGE} strokeWidth="1.2" />
        {[1, 2, 3, 4, 5].map((cm) => (
          <g key={cm}>
            <line x1={xAt(cm)} x2={xAt(cm)} y1={p.cordY + 14} y2={p.cordY + 22} stroke={INK} strokeWidth="1" />
            <text x={xAt(cm) - 3} y={p.cordY + 32} fontFamily={FONT} fontSize="5" fill={INK}>
              {cm}
            </text>
          </g>
        ))}
        <line x1={xAt(MIN_CLAMP_CM)} x2={xAt(MIN_CLAMP_CM)} y1={p.cordY - 26} y2={p.cordY + 22} stroke={MARK} strokeWidth="1.4" strokeDasharray="2 2" />
        <text x={xAt(MIN_CLAMP_CM) - 16} y={p.cordY - 30} fontFamily={FONT} fontSize="5" fill={MARK}>
          2.5 cm
        </text>
        {placed !== null && (
          <g>
            <rect x={xAt(placed) - 3} y={p.cordY - 16} width="6" height="32" rx="1" fill={close ? BAD : MARK} />
            <text x="8" y={p.h - 8} fontFamily={FONT} fontSize="6" fill={close ? BAD : MARK}>
              {placed.toFixed(1)} cm FROM THE UMBILICUS{close ? '. TOO CLOSE' : ''}
            </text>
          </g>
        )}
        {placed === null && (
          <text x="8" y={p.h - 8} fontFamily={FONT} fontSize="5.5" fill={INK}>
            TAP THE CORD AT 2.5 cm OR FURTHER
          </text>
        )}
      </svg>
    </div>
  )
}
