/**
 * Diagrams for the nurse bench: the signs at the vulva, and the cord measured from the umbilicus.
 */
import { useRef, useState, type ReactNode } from 'react'
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
      <ellipse data-testid="nurse-sign-perineum" cx="120" cy="88" rx="26" ry="26" fill="#c4626a" stroke={hot(run.perineum)} strokeWidth={run.perineum ? 2.4 : 1.2} onPointerDown={() => onSign('perineum')} />
      <ellipse cx="120" cy="94" rx="14" ry="8" fill="#e8b494" stroke={SKIN_EDGE} strokeWidth="0.8" style={{ pointerEvents: 'none' }} />
      <circle data-testid="nurse-sign-crowning" cx="120" cy="52" r="14" fill="#c99a88" stroke={hot(run.crowning)} strokeWidth={run.crowning ? 2.6 : 1.2} onPointerDown={() => onSign('crowning')} />
      <path d="M108 48 Q120 36 132 48 Q120 42 108 48 Z" fill={HAIR} style={{ pointerEvents: 'none' }} />
      <ellipse data-testid="nurse-sign-anus" cx="120" cy="124" rx="12" ry="8" fill="#a86858" stroke={hot(run.anus)} strokeWidth={run.anus ? 2.4 : 1} onPointerDown={() => onSign('anus')} />
      <text x="78" y="36" fontFamily={FONT} fontSize="5" fill={hot(run.crowning)} style={{ pointerEvents: 'none' }}>
        HEAD
      </text>
      <text x="154" y="96" fontFamily={FONT} fontSize="5" fill={hot(run.perineum)}>
        PERINEUM
      </text>
      <text x="136" y="132" fontFamily={FONT} fontSize="5" fill={hot(run.anus)}>
        ANUS
      </text>
      <path data-testid="nurse-sign-push" d="M8 168 Q8 150 28 150 L212 150 Q228 150 228 164 L228 176 Q228 184 212 184 L28 184 Q8 184 8 168 Z" fill={run.push ? '#e5f5df' : '#fff'} stroke={hot(run.push)} strokeWidth="1.2" onPointerDown={() => onSign('push')} />
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

function Stage({ h, children }: { h: number; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 240 ${h}`} className="io-figure mx-auto block w-full max-w-[360px] select-none">
      <rect width="240" height={h} fill="#f4f0e4" />
      {children}
    </svg>
  )
}

function Chip({ id, x, y, w, h, on, title, onPress }: { id: string; x: number | string; y: number | string; w: number | string; h: number | string; on: boolean; title: string; onPress: () => void }) {
  const X = Number(x)
  const Y = Number(y)
  const W = Number(w)
  const H = Number(h)
  return (
    <g data-testid={id} onPointerDown={(e) => { e.stopPropagation(); onPress() }} style={{ cursor: 'pointer' }}>
      <rect x={X} y={Y} width={W} height={H} rx="3" fill={on ? '#e5f5df' : '#fff'} stroke={on ? MARK : INK} strokeWidth="1.6" />
      <text x={X + 6} y={Y + H / 2 + 2} fontFamily={FONT} fontSize="5" fill={INK}>
        {title}
      </text>
    </g>
  )
}

export function AskScene({ run, onAsk }: { run: NurseRun; onAsk: (key: 'liquorAsk' | 'allergy' | 'obstetric' | 'weeks') => void }) {
  const [line, setLine] = useState('…')
  function ask(key: 'liquorAsk' | 'allergy' | 'obstetric' | 'weeks', said: string) {
    setLine(said)
    onAsk(key)
  }
  return (
    <Stage h={168}>
      <ellipse cx="46" cy="48" rx="22" ry="26" fill={SKIN} stroke={SKIN_EDGE} />
      <text x="28" y="88" fontFamily={FONT} fontSize="5" fill={INK}>
        MRS LAI
      </text>
      <rect x="84" y="16" width="144" height="64" rx="6" fill="#fff" stroke={INK} />
      <text x="92" y="44" fontFamily={FONT} fontSize="5.5" fill={INK}>
        {line}
      </text>
      <Chip id="nurse-ask-liquor" x="8" y="108" w="108" h="24" on={run.liquorAsk} title="WATERS" onPress={() => ask('liquorAsk', 'Clear.')} />
      <Chip id="nurse-ask-allergy" x="124" y="108" w="108" h="24" on={run.allergy} title="ALLERGIES" onPress={() => ask('allergy', 'None.')} />
      <Chip id="nurse-ask-obstetric" x="8" y="138" w="108" h="24" on={run.obstetric} title="BABIES" onPress={() => ask('obstetric', 'One. No scar.')} />
      <Chip id="nurse-ask-weeks" x="124" y="138" w="108" h="24" on={run.weeks} title="WEEKS" onPress={() => ask('weeks', '39 weeks.')} />
    </Stage>
  )
}

export function PrepareScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'ppe' | 'set' | 'pad' | 'drugOut' | 'bottles' | 'form' | 'explain' | 'consent') => void }) {
  return (
    <Stage h={196}>
      <Chip id="nurse-ppe" x="8" y="8" w="70" h="52" on={run.ppe} title="GOWN" onPress={() => onFlag('ppe')} />
      <rect x="86" y="8" width="146" height="52" rx="3" fill="#fff" stroke={INK} />
      <text x="94" y="22" fontFamily={FONT} fontSize="5" fill={INK}>
        TROLLEY
      </text>
      <text x="94" y="40" fontFamily={FONT} fontSize="5" fill={MARK}>
        {[run.set && 'SET', run.pad && 'PAD', run.drugOut && 'DRUG', run.bottles && 'BLOOD', run.form && 'FORM'].filter(Boolean).join(' ') || 'EMPTY'}
      </text>
      <Chip id="nurse-set" x="8" y="70" w="70" h="28" on={run.set} title="SET" onPress={() => onFlag('set')} />
      <Chip id="nurse-pad" x="84" y="70" w="72" h="28" on={run.pad} title="PAD" onPress={() => onFlag('pad')} />
      <Chip id="nurse-drug-out" x="162" y="70" w="70" h="28" on={run.drugOut} title="DRUG" onPress={() => onFlag('drugOut')} />
      <Chip id="nurse-bottles" x="8" y="104" w="108" h="28" on={run.bottles} title="BOTTLES" onPress={() => onFlag('bottles')} />
      <Chip id="nurse-form" x="124" y="104" w="108" h="28" on={run.form} title="BBA FORM" onPress={() => onFlag('form')} />
      <ellipse cx="36" cy="162" rx="18" ry="20" fill={SKIN} stroke={SKIN_EDGE} />
      <Chip id="nurse-explain" x="64" y="146" w="80" h="28" on={run.explain} title="STAY" onPress={() => onFlag('explain')} />
      <Chip id="nurse-consent" x="150" y="146" w="82" h="28" on={run.consent} title="CONSENT" onPress={() => onFlag('consent')} />
    </Stage>
  )
}

export function BirthScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'time' | 'cord' | 'liquor' | 'shown' | 'birthmark') => void }) {
  const hot = (on: boolean) => (on ? MARK : INK)
  return (
    <Stage h={132}>
      <g data-testid="nurse-time" onPointerDown={() => onFlag('time')} style={{ cursor: 'pointer' }}>
        <circle cx="28" cy="28" r="18" fill={run.time ? '#e5f5df' : '#fff'} stroke={hot(run.time)} strokeWidth="1.6" />
        <text x="16" y="30" fontFamily={FONT} fontSize="5" fill={INK}>
          TIME
        </text>
      </g>
      <path d="M70 20 H190 Q210 20 210 48 V100 H70 Z" fill={SKIN} stroke={SKIN_EDGE} />
      <ellipse data-testid="nurse-show" cx="140" cy="62" rx="34" ry="22" fill="#f3d2be" stroke={hot(run.shown)} strokeWidth="1.8" onPointerDown={() => onFlag('shown')} />
      <circle data-testid="nurse-cord" cx="140" cy="40" r="9" fill={CORD} stroke={hot(run.cord)} strokeWidth="1.8" onPointerDown={() => onFlag('cord')} />
      <ellipse data-testid="nurse-liquor" cx="188" cy="96" rx="18" ry="10" fill="#d5e8f5" stroke={hot(run.liquor)} strokeWidth="1.6" onPointerDown={() => onFlag('liquor')} />
      <circle data-testid="nurse-look" cx="112" cy="58" r="8" fill={run.birthmark ? '#e5f5df' : '#e7b89a'} stroke={hot(run.birthmark)} strokeWidth="1.6" onPointerDown={() => onFlag('birthmark')} />
      <text x="78" y="124" fontFamily={FONT} fontSize="5" fill={INK}>
        {run.shown ? 'A GIRL' : 'BABY'}
        {run.cord ? '  NO CORD' : ''}
        {run.liquor ? '  CLEAR' : ''}
      </text>
    </Stage>
  )
}

export function DrugScene({ run, onPalpate, onInject, onFlag }: { run: NurseRun; onPalpate: () => void; onInject: () => void; onFlag: (key: 'drugTime' | 'edta' | 'clotted') => void }) {
  const early = run.drugEarly
  return (
    <Stage h={176}>
      <ellipse data-testid="nurse-palpate" cx="78" cy="58" rx="52" ry="36" fill={run.palpated ? '#e5f5df' : SKIN} stroke={run.palpated ? MARK : SKIN_EDGE} strokeWidth="1.8" onPointerDown={onPalpate} />
      <text x="48" y="62" fontFamily={FONT} fontSize="5" fill={INK}>
        {run.palpated ? 'ONE BABY' : 'FEEL'}
      </text>
      <g data-testid="nurse-syntometrine" onPointerDown={onInject} style={{ cursor: 'pointer' }}>
        <rect x="150" y="22" width="70" height="72" rx="8" fill={early ? '#f8d0d4' : run.syntometrine ? '#e5f5df' : SKIN} stroke={early ? BAD : run.syntometrine ? MARK : SKIN_EDGE} strokeWidth="1.8" />
        <rect x="176" y="8" width="8" height="22" fill="#c9a227" />
        <text x="160" y="64" fontFamily={FONT} fontSize="5" fill={INK}>
          INJECT
        </text>
      </g>
      <Chip id="nurse-drug-time" x="8" y="128" w="70" h="36" on={run.drugTime} title="TIME" onPress={() => onFlag('drugTime')} />
      <Chip id="nurse-label-edta" x="84" y="128" w="72" h="36" on={run.edta} title="EDTA" onPress={() => onFlag('edta')} />
      <Chip id="nurse-label-clotted" x="162" y="128" w="70" h="36" on={run.clotted} title="CLOTTED" onPress={() => onFlag('clotted')} />
    </Stage>
  )
}

export function MotherScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'gush' | 'lengthen' | 'fundus' | 'vessels' | 'bag' | 'padOn' | 'warm' | 'loss' | 'pulse') => void }) {
  const cordW = run.lengthen ? 90 : 36
  return (
    <Stage h={188}>
      <ellipse data-testid="nurse-sign-fundus" cx="70" cy={run.fundus ? 28 : 48} rx="36" ry="18" fill={run.fundus ? '#e5f5df' : SKIN} stroke={run.fundus ? MARK : SKIN_EDGE} strokeWidth="1.6" onPointerDown={() => onFlag('fundus')} />
      <path d={`M70 66 h${cordW}`} stroke={run.lengthen ? MARK : CORD_EDGE} strokeWidth="6" strokeLinecap="round" />
      <rect data-testid="nurse-sign-length" x="60" y="54" width="120" height="24" fill="transparent" onPointerDown={() => onFlag('lengthen')} />
      <circle data-testid="nurse-sign-gush" cx="70" cy="92" r="12" fill={run.gush ? BAD : '#e7b89a'} onPointerDown={() => onFlag('gush')} />
      <g data-testid="nurse-vessels" onPointerDown={() => onFlag('vessels')} style={{ cursor: 'pointer' }}>
        <circle cx="168" cy="36" r="5" fill={run.vessels ? MARK : INK} />
        <circle cx="180" cy="36" r="5" fill={run.vessels ? MARK : INK} />
        <circle cx="174" cy="48" r="6" fill={run.vessels ? '#7eb6e0' : CORD} stroke={INK} />
      </g>
      <Chip id="nurse-bag" x="150" y="64" w="80" h="28" on={run.bag} title="BAG" onPress={() => onFlag('bag')} />
      <Chip id="nurse-pad-on" x="8" y="116" w="70" h="28" on={run.padOn} title="PAD" onPress={() => onFlag('padOn')} />
      <Chip id="nurse-warm" x="84" y="116" w="72" h="28" on={run.warm} title="BLANKET" onPress={() => onFlag('warm')} />
      <Chip id="nurse-loss" x="162" y="116" w="70" h="28" on={run.loss} title="JUG" onPress={() => onFlag('loss')} />
      <Chip id="nurse-pulse" x="84" y="152" w="72" h="28" on={run.pulse} title="PULSE" onPress={() => onFlag('pulse')} />
    </Stage>
  )
}

export function HandoverScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'stable' | 'ward' | 'specimens' | 'papers' | 'escort') => void }) {
  return (
    <Stage h={150}>
      <Chip id="nurse-stable" x="8" y="12" w="108" h="40" on={run.stable} title="BOTH OK" onPress={() => onFlag('stable')} />
      <Chip id="nurse-ward" x="124" y="12" w="108" h="40" on={run.ward} title="PHONE" onPress={() => onFlag('ward')} />
      <Chip id="nurse-specimens" x="8" y="60" w="108" h="36" on={run.specimens} title="TRAY" onPress={() => onFlag('specimens')} />
      <Chip id="nurse-papers" x="124" y="60" w="108" h="36" on={run.papers} title="NOTES" onPress={() => onFlag('papers')} />
      <Chip id="nurse-escort" x="8" y="106" w="224" h="32" on={run.escort} title="WALK WITH THEM" onPress={() => onFlag('escort')} />
    </Stage>
  )
}
