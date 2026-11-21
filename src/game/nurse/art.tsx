/**
 * The A&E nurse's view, drawn the way the birth looks from where she stands.
 * Nurse Chiu conducts. The pictures follow that job: look from the foot of the bed, ask at the
 * bedside, dress and open the set, then the birth frame by frame, the thigh injection, the
 * placenta separating on its own, and the trolley leaving.
 */
import { useRef, useState, type ReactNode } from 'react'
import { toLocal } from '../bench/kit'
import { Hand } from '../delivery/art'
import { CLAMP_PICTURE, MIN_CLAMP_CM, cmAt, type NurseRun } from './model'

const FONT = 'Press Start 2P, monospace'
const INK = '#2c2416'
const PAPER = '#f4f0e4'
const SKIN = '#e8b494'
const SKIN_DARK = '#d89c7c'
const SKIN_EDGE = '#8a5238'
const MUCOSA = '#c4626a'
const MUCOSA_DEEP = '#8a2e3a'
const SCALP = '#c99a88'
const HAIR = '#3d2c22'
const DRAPE = '#86aebd'
const DRAPE_DARK = '#6f98a8'
const CORD = '#dfe3ec'
const CORD_STRIPE = '#b4bccf'
const BLOOD = '#9a1020'
const MARK = '#1d6b45'
const BAD = '#9a1020'
const METAL = '#9aa3ad'

function T({ x, y, children, size = 5, fill = INK }: { x: number | string; y: number | string; children: string; size?: number | string; fill?: string }) {
  return (
    <text x={Number(x)} y={Number(y)} fontFamily={FONT} fontSize={Number(size)} fill={fill} style={{ pointerEvents: 'none' }}>
      {children}
    </text>
  )
}

function Stage({ h, children }: { h: number; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 240 ${h}`} className="io-figure mx-auto mb-2 block w-full max-w-[360px] select-none">
      <rect width="240" height={h} fill={PAPER} />
      {children}
    </svg>
  )
}

/** A picture you tap. The drawing sits under a clear hit rect, so labels cannot steal the centre. */
function Hot({ id, x, y, w, h, on, onPress, children }: { id: string; x: number; y: number; w: number; h: number; on: boolean; onPress: () => void; children?: ReactNode }) {
  return (
    <g>
      {children && <g style={{ pointerEvents: 'none' }}>{children}</g>}
      <rect data-testid={id} x={x} y={y} width={w} height={h} rx="3" fill="transparent" style={{ cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); onPress() }} />
      {on && <circle cx={x + w - 5} cy={y + 5} r="2.4" fill={MARK} style={{ pointerEvents: 'none' }} />}
    </g>
  )
}

function Dots({ n, i }: { n: number; i: number }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      {Array.from({ length: n }, (_, k) => (
        <circle key={k} cx={120 + (k - (n - 1) / 2) * 12} cy="10" r={k === i ? 3.2 : 2} fill={k < i ? MARK : k === i ? INK : '#c8c0b0'} />
      ))}
    </g>
  )
}

function Hair({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return <path d={`M${cx - r * 0.9} ${cy - r * 0.1} Q${cx} ${cy - r * 1.15} ${cx + r * 0.9} ${cy - r * 0.1} Q${cx} ${cy - r * 0.2} ${cx - r * 0.9} ${cy - r * 0.1} Z`} fill={HAIR} />
}

/* ---------------------------------------------------------------- look: one view, four signs */

/**
 * From the foot of the bed, lithotomy, the moment the videos hold on. The head stays between
 * contractions. The hit shapes are the head, the bulge, the anus, and what she says.
 */
export function LookPicture({ run, onSign }: { run: NurseRun; onSign: (sign: 'crowning' | 'perineum' | 'anus' | 'push') => void }) {
  const edge = (on: boolean) => (on ? MARK : SKIN_EDGE)
  return (
    <svg viewBox="0 0 240 206" className="io-figure mx-auto mb-2 block w-full max-w-[360px] select-none" data-testid="nurse-picture">
      <rect width="240" height="206" fill={DRAPE} />
      <g style={{ pointerEvents: 'none' }}>
        <path d="M0 22 Q46 40 42 108 Q38 168 16 206 L0 206 Z" fill={DRAPE_DARK} />
        <path d="M240 22 Q194 40 198 108 Q202 168 224 206 L240 206 Z" fill={DRAPE_DARK} />
        <ellipse cx="120" cy="104" rx="70" ry="66" fill={SKIN} stroke={SKIN_EDGE} />
        <ellipse cx="120" cy="44" rx="38" ry="18" fill={SKIN_DARK} />
        {[-18, -8, 2, 12, 22].map((x) => (
          <path key={x} d={`M${120 + x} 34 q2 -4 4 0`} stroke="#6a4430" strokeWidth="0.8" fill="none" />
        ))}
        <rect width="240" height="16" fill={DRAPE_DARK} />
        <path d="M120 58 Q92 64 90 86 Q88 108 120 116" fill="none" stroke={SKIN_EDGE} strokeWidth="2" />
        <path d="M120 58 Q148 64 150 86 Q152 108 120 116" fill="none" stroke={SKIN_EDGE} strokeWidth="2" />
        <ellipse cx="120" cy="98" rx="22" ry="14" fill={MUCOSA} stroke={MUCOSA_DEEP} />
        <T x="6" y="12" size="4.4" fill="#f8f8f0">FROM THE FOOT</T>
        <T x="176" y="200" size="4" fill="#f8f8f0">HER L</T>
        <T x="8" y="200" size="4" fill="#f8f8f0">HER R</T>
      </g>
      <Hand x={120} y={52} angle={180} scale={0.55} />
      <Hand x={186} y={128} angle={-20} scale={0.7}>
        <rect x="-16" y="-30" width="28" height="14" rx="2" fill="#fbfbf6" stroke="#b8b8a8" />
      </Hand>
      <ellipse data-testid="nurse-sign-perineum" cx="120" cy="124" rx="32" ry="12" fill="#f6ece6" stroke={edge(run.perineum)} strokeWidth={run.perineum ? 2.2 : 1.1} onPointerDown={() => onSign('perineum')} />
      <ellipse data-testid="nurse-sign-anus" cx="120" cy="156" rx="11" ry="8" fill="#b07a64" stroke={edge(run.anus)} strokeWidth={run.anus ? 2.2 : 1} onPointerDown={() => onSign('anus')} />
      <g data-testid="nurse-sign-crowning" onPointerDown={() => onSign('crowning')} style={{ cursor: 'pointer' }}>
        <circle cx="120" cy="78" r="18" fill={SCALP} stroke={SKIN_EDGE} strokeWidth="1.2" />
        <path d="M104 74 Q120 56 136 74 Q120 68 104 74 Z" fill={HAIR} />
        <path d="M110 66 q1 5 0 8 M120 62 q1 6 0 10 M130 66 q-1 5 0 8" stroke="#5a463a" strokeWidth="0.8" fill="none" />
        <path d="M112 84 q4 2 8 0" stroke="#f4f0e0" strokeWidth="1.4" fill="none" />
      </g>
      <g style={{ pointerEvents: 'none' }}>
        <T x="148" y="70" size="4.2" fill={run.crowning ? MARK : '#203040'}>HEAD STAYS</T>
        <T x="156" y="126" size="4.2" fill={run.perineum ? MARK : '#203040'}>BULGE</T>
        <T x="140" y="160" size="4.2" fill={run.anus ? MARK : '#203040'}>POUTING</T>
      </g>
      <rect data-testid="nurse-sign-push" x="8" y="174" width="224" height="26" rx="6" fill={run.push ? '#e5f5df' : '#fff'} stroke={run.push ? MARK : INK} strokeWidth="1.2" onPointerDown={() => onSign('push')} />
      <T x="16" y="186" size="5" fill={run.push ? MARK : INK}>SHE SAYS: I HAVE TO PUSH</T>
    </svg>
  )
}

/* ---------------------------------------------------------------- ask: at the bedside */

export function AskScene({ run, onAsk }: { run: NurseRun; onAsk: (key: 'liquorAsk' | 'allergy' | 'obstetric' | 'weeks') => void }) {
  const [line, setLine] = useState('Ask her.')
  function ask(key: 'liquorAsk' | 'allergy' | 'obstetric' | 'weeks', said: string) {
    setLine(said)
    onAsk(key)
  }
  return (
    <Stage h={196}>
      <g style={{ pointerEvents: 'none' }}>
        <rect x="6" y="28" width="228" height="112" rx="8" fill="#d5e2ea" stroke="#8aa0b0" />
        <path d="M20 78 Q70 60 130 74 Q190 88 220 70 L226 130 L16 132 Z" fill={SKIN} stroke={SKIN_EDGE} />
        <T x="8" y="16" size="4.4">AT THE BEDSIDE</T>
      </g>
      <Hot id="nurse-ask-weeks" x={14} y={34} w={58} h={62} on={run.weeks} onPress={() => ask('weeks', '39 weeks. My second.')}>
        <circle cx="43" cy="62" r="20" fill={SKIN} stroke={SKIN_EDGE} />
        <path d="M26 56 Q43 40 60 56 Q43 48 26 56 Z" fill={HAIR} />
        <path d="M34 64 q4 2 8 0 M46 64 q4 2 8 0" stroke={SKIN_EDGE} fill="none" />
        <path d="M36 74 q7 3 14 0" stroke="#8a3a3a" fill="none" />
        <T x="22" y="96" size="4">WEEKS</T>
      </Hot>
      <Hot id="nurse-ask-obstetric" x={78} y={40} w={78} h={64} on={run.obstetric} onPress={() => ask('obstetric', 'One baby. No scar. No bleed.')}>
        <ellipse cx="116" cy="72" rx="32" ry="22" fill={run.obstetric ? '#f3d8cc' : SKIN} stroke={SKIN_EDGE} />
        <path d="M96 78 q20 -16 40 0" stroke={SKIN_EDGE} fill="none" strokeWidth="1.2" />
        <T x="92" y="98" size="4">BELLY</T>
      </Hot>
      <Hot id="nurse-ask-allergy" x={164} y={36} w={66} h={70} on={run.allergy} onPress={() => ask('allergy', 'No allergies. No medicines.')}>
        <path d="M176 96 Q170 70 196 48 L210 58 Q186 82 196 100 Z" fill={SKIN} stroke={SKIN_EDGE} />
        <circle cx="198" cy="52" r="7" fill={SKIN} stroke={SKIN_EDGE} />
        <T x="168" y="100" size="4">HER ARM</T>
      </Hot>
      <Hot id="nurse-ask-liquor" x={16} y={112} w={208} h={28} on={run.liquorAsk} onPress={() => ask('liquorAsk', 'The waters are clear.')}>
        <ellipse cx="70" cy="126" rx="28" ry="8" fill="#d7eef8" stroke="#7aa4c0" />
        <ellipse cx="108" cy="128" rx="16" ry="5" fill="#eef8fc" stroke="#9ec0d4" />
        <T x="132" y="130" size="4.4">CLEAR WATERS</T>
      </Hot>
      <rect x="8" y="156" width="224" height="32" rx="6" fill="#fff" stroke={INK} style={{ pointerEvents: 'none' }} />
      <T x="16" y="176" size="5">{line}</T>
    </Stage>
  )
}

/* ---------------------------------------------------------------- prepare: the bay */

function Forceps({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d="M-2 0 L-2 22 M2 0 L2 22" stroke={METAL} strokeWidth="1.3" />
      <path d="M-4 -2 L0 4 L4 -2" fill="none" stroke={METAL} strokeWidth="1.2" />
      <circle cx="-2" cy="26" r="2.4" fill="none" stroke={METAL} strokeWidth="1.1" />
      <circle cx="2" cy="26" r="2.4" fill="none" stroke={METAL} strokeWidth="1.1" />
    </g>
  )
}

export function PrepareScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'ppe' | 'set' | 'pad' | 'drugOut' | 'bottles' | 'form' | 'explain' | 'consent') => void }) {
  return (
    <Stage h={250}>
      <g style={{ pointerEvents: 'none' }}>
        <rect x="82" y="6" width="152" height="132" rx="4" fill="#e6eaee" stroke="#98a2ac" />
        <T x="88" y="16" size="4" fill="#606878">TROLLEY</T>
      </g>
      <Hot id="nurse-ppe" x={6} y={8} w={72} h={108} on={run.ppe} onPress={() => onFlag('ppe')}>
        <circle cx="42" cy="28" r="12" fill={SKIN} stroke={SKIN_EDGE} />
        <path d="M32 24 Q42 16 52 24" fill={HAIR} />
        {run.ppe ? (
          <g>
            <path d="M24 40 H60 L66 108 H18 Z" fill="#2f6fad" stroke="#1d4e80" />
            <path d="M30 46 h8 M46 46 h8" stroke="#d8ecff" strokeWidth="1.4" />
            <rect x="32" y="24" width="20" height="7" rx="2" fill="#d7eef8" stroke="#5a7a90" />
            <circle cx="24" cy="96" r="6" fill="#efe3c8" stroke="#9a8a68" />
            <circle cx="60" cy="96" r="6" fill="#efe3c8" stroke="#9a8a68" />
          </g>
        ) : (
          <g>
            <path d="M28 42 H56 L60 100 H24 Z" fill="#d9efe4" stroke="#3d6b58" />
            <path d="M18 78 q10 6 8 16 M66 78 q-10 6 -8 16" stroke={SKIN} strokeWidth="4" fill="none" />
            <T x="16" y="112" size="3.6">WASH AND DRESS</T>
          </g>
        )}
      </Hot>
      <Hot id="nurse-set" x={88} y={22} w={70} h={54} on={run.set} onPress={() => onFlag('set')}>
        <ellipse cx="122" cy="52" rx="30" ry="16" fill="#d5dde4" stroke="#7d8b98" />
        {run.set ? (
          <g>
            <Forceps x={108} y={36} rot={-8} />
            <Forceps x={122} y={36} rot={6} />
            <path d="M136 40 l8 16 M144 40 l-6 16" stroke={METAL} strokeWidth="1.2" />
            <rect x="128" y="44" width="5" height="10" rx="1" fill="#f4f4f8" stroke="#3878b8" />
            <rect x="136" y="44" width="5" height="10" rx="1" fill="#f4f4f8" stroke="#3878b8" />
          </g>
        ) : (
          <g>
            <rect x="100" y="36" width="44" height="22" rx="2" fill="#c5ddd2" stroke="#3d6b58" />
            <T x="106" y="50" size="4">SET</T>
          </g>
        )}
      </Hot>
      <Hot id="nurse-drug-out" x={164} y={22} w={66} h={54} on={run.drugOut} onPress={() => onFlag('drugOut')}>
        <path d="M190 30 L196 38 V62 Q193 68 187 62 V38 Z" fill="#f4f0c8" stroke="#a09040" />
        <rect x="188" y="44" width="8" height="12" fill="#e6c84a" />
        <T x="168" y="74" size="3.6">{run.drugOut ? '1 ml READY' : '1 ml NOT GIVEN'}</T>
      </Hot>
      <Hot id="nurse-pad" x={88} y={80} w={70} h={52} on={run.pad} onPress={() => onFlag('pad')}>
        <rect x="94" y="88" width="14" height="28" rx="3" fill="#d7eef8" stroke="#3a7ca5" />
        <rect x="97" y="96" width="8" height="12" fill="#7ec8e8" />
        <rect x="114" y="96" width="36" height="16" rx="3" fill="#f7f7f2" stroke="#b0b0a4" />
        <path d="M118 104 h28" stroke="#7eb6e0" strokeWidth="2" />
        <T x="92" y="128" size="3.6">0.05% AND PAD</T>
      </Hot>
      <Hot id="nurse-bottles" x={164} y={80} w={66} h={52} on={run.bottles} onPress={() => onFlag('bottles')}>
        <rect x="172" y="92" width="16" height="26" rx="2" fill="#f4f4f8" stroke="#6878a0" />
        <rect x="174" y="88" width="12" height="6" fill="#6a3d8a" />
        <rect x="196" y="92" width="16" height="26" rx="2" fill="#f4f4f8" stroke="#a86858" />
        <rect x="198" y="88" width="12" height="6" fill="#b03040" />
        <T x="170" y="128" size="3.6">EDTA TSH</T>
      </Hot>
      <Hot id="nurse-form" x={6} y={122} w={72} h={52} on={run.form} onPress={() => onFlag('form')}>
        <rect x="16" y="128" width="48" height="36" rx="2" fill="#fff" stroke={INK} />
        <path d="M22 136 h36 M22 144 h28 M22 152 h32" stroke="#c8c0b0" strokeWidth="1" />
        <T x="22" y="160" size="4">BBA</T>
      </Hot>
      <Hot id="nurse-explain" x={84} y={142} w={148} h={48} on={run.explain} onPress={() => onFlag('explain')}>
        <circle cx="108" cy="166" r="14" fill={SKIN} stroke={SKIN_EDGE} />
        <path d="M96 160 Q108 148 120 160" fill={HAIR} />
        <path d="M126 170 h40" stroke={SKIN} strokeWidth="6" strokeLinecap="round" />
        <circle cx="168" cy="170" r="6" fill="#efe3c8" stroke="#9a8a68" />
        <T x="176" y="166" size="3.8">I AM STAYING</T>
      </Hot>
      <Hot id="nurse-consent" x={8} y={198} w={224} h={44} on={run.consent} onPress={() => onFlag('consent')}>
        <path d="M28 214 l10 14 M40 214 l-6 14" stroke={METAL} strokeWidth="1.4" />
        <circle cx="34" cy="232" r="3" fill="none" stroke={METAL} />
        <T x="52" y="216" size="4.2">IF A CUT IS NEEDED</T>
        <T x="52" y="230" size="4" fill="#606878">YOU DO NOT DECIDE</T>
      </Hot>
    </Stage>
  )
}

/* ---------------------------------------------------------------- birth, one frame at a time */

function birthStep(run: NurseRun) {
  if (!run.time) return 0
  if (!run.cord) return 1
  if (!run.liquor) return 2
  if (!run.shown) return 3
  if (!run.birthmark) return 4
  return 5
}

function Clock({ noted }: { noted: boolean }) {
  return (
    <g>
      <circle cx="36" cy="78" r="26" fill={noted ? '#e5f5df' : '#fff'} stroke={noted ? MARK : INK} strokeWidth="1.6" />
      <path d="M36 78 L36 60" stroke={INK} strokeWidth="1.4" />
      <path d="M36 78 L48 84" stroke={INK} strokeWidth="1.2" />
      <circle cx="36" cy="78" r="1.6" fill={INK} />
    </g>
  )
}

export function BirthScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'time' | 'cord' | 'liquor' | 'shown' | 'birthmark') => void }) {
  const step = birthStep(run)
  return (
    <Stage h={176}>
      <Dots n={6} i={step} />
      {step === 0 && (
        <>
          <g style={{ pointerEvents: 'none' }}>
            <rect y="18" width="240" height="158" fill="#e7eef2" />
            <T x="78" y="28" size="4.4">NURSE CHIU DELIVERS</T>
            <ellipse cx="150" cy="100" rx="46" ry="36" fill={SKIN} stroke={SKIN_EDGE} />
            <circle cx="150" cy="78" r="16" fill={SCALP} stroke={SKIN_EDGE} />
            <Hair cx={150} cy={74} r={15} />
            <path d="M150 96 q20 20 10 36" stroke={CORD} strokeWidth="5" fill="none" />
          </g>
          <Hand x={118} y={88} angle={40} scale={0.8} />
          <Hand x={186} y={112} angle={-50} scale={0.8} />
          <Hot id="nurse-time" x={8} y={48} w={56} h={64} on={false} onPress={() => onFlag('time')}>
            <Clock noted={false} />
            <T x="16" y="118" size="4">CALL TIME</T>
          </Hot>
        </>
      )}
      {step === 1 && (
        <>
          <g style={{ pointerEvents: 'none' }}>
            <rect y="18" width="240" height="158" fill="#f6efe8" />
            <T x="78" y="28" size="4.4">LOOK AT THE NECK</T>
            <circle cx="120" cy="70" r="28" fill={SCALP} stroke={SKIN_EDGE} />
            <Hair cx={120} cy={62} r={26} />
            <path d="M78 108 Q120 96 162 108 L170 150 L70 150 Z" fill={SKIN} stroke={SKIN_EDGE} />
            <path d="M120 112 Q150 140 168 168" stroke={CORD} strokeWidth="7" fill="none" />
            <path d="M120 112 Q150 140 168 168" stroke={CORD_STRIPE} strokeWidth="7" strokeDasharray="2 4" fill="none" />
            <T x="16" y="164" size="4">CORD IS ON THE CHEST</T>
          </g>
          <Hot id="nurse-cord" x={88} y={96} w={64} h={36} on={false} onPress={() => onFlag('cord')}>
            <ellipse cx="120" cy="114" rx="22" ry="12" fill={SKIN_DARK} stroke={SKIN_EDGE} />
          </Hot>
        </>
      )}
      {step === 2 && (
        <>
          <g style={{ pointerEvents: 'none' }}>
            <rect y="18" width="240" height="158" fill={DRAPE} />
            <ellipse cx="120" cy="96" rx="64" ry="50" fill={SKIN} stroke={SKIN_EDGE} />
            <ellipse cx="120" cy="90" rx="16" ry="18" fill={MUCOSA} stroke={MUCOSA_DEEP} />
            <rect x="70" y="118" width="100" height="28" rx="3" fill="#f7f7f2" stroke="#b0b0a4" />
            <T x="70" y="28" size="4.4" fill="#f8f8f0">LIQUOR ON THE PAD</T>
          </g>
          <Hot id="nurse-liquor" x={78} y={120} w={84} h={28} on={false} onPress={() => onFlag('liquor')}>
            <ellipse cx="120" cy="134" rx="30" ry="8" fill="#d5eef8" stroke="#6a98b8" />
          </Hot>
        </>
      )}
      {step === 3 && (
        <>
          <g style={{ pointerEvents: 'none' }}>
            <rect y="18" width="240" height="158" fill="#d8e4ea" />
            <path d="M16 20 H224 L230 168 H10 Z" fill={SKIN} stroke={SKIN_EDGE} />
            <circle cx="120" cy="42" r="12" fill={SKIN} stroke={SKIN_EDGE} />
            <path d="M112 40 q4 2 8 0 M116 46 q4 2 8 0" stroke={SKIN_EDGE} fill="none" />
            <T x="8" y="32" size="4">SHOW HER THE BABY</T>
          </g>
          <Hot id="nurse-show" x={70} y={58} w={100} h={90} on={false} onPress={() => onFlag('shown')}>
            <ellipse cx="92" cy="110" rx="10" ry="18" fill="#e8a898" transform="rotate(-25 92 110)" />
            <ellipse cx="148" cy="110" rx="10" ry="18" fill="#e8a898" transform="rotate(25 148 110)" />
            <ellipse cx="120" cy="108" rx="28" ry="32" fill="#e8a898" stroke={SKIN_EDGE} />
            <circle cx="120" cy="74" r="16" fill="#e8a898" stroke={SKIN_EDGE} />
            <path d="M112 78 q4 2 8 0" stroke="#5a3428" fill="none" />
          </Hot>
          <Hand x={78} y={100} angle={70} scale={0.7} />
          <Hand x={168} y={108} angle={-70} scale={0.7} />
        </>
      )}
      {step === 4 && (
        <>
          <g style={{ pointerEvents: 'none' }}>
            <rect y="18" width="240" height="158" fill="#f6efe8" />
            <T x="62" y="28" size="4.4">LOOK OVER HER SKIN</T>
          </g>
          <Hot id="nurse-look" x={48} y={40} w={144} h={110} on={false} onPress={() => onFlag('birthmark')}>
            <ellipse cx="120" cy="108" rx="40" ry="28" fill="#e8a898" stroke={SKIN_EDGE} />
            <circle cx="120" cy="62" r="20" fill="#e8a898" stroke={SKIN_EDGE} />
            <path d="M100 100 q20 8 40 0 M104 116 q16 6 32 0" stroke="#d09080" fill="none" />
          </Hot>
        </>
      )}
      {step === 5 && (
        <g style={{ pointerEvents: 'none' }}>
          <rect y="18" width="240" height="158" fill="#d8e4ea" />
          <path d="M10 16 H230 L236 168 H4 Z" fill={SKIN} stroke={SKIN_EDGE} />
          <ellipse cx="78" cy="118" rx="9" ry="16" fill="#e8a898" transform="rotate(-28 78 118)" />
          <ellipse cx="162" cy="118" rx="9" ry="16" fill="#e8a898" transform="rotate(28 162 118)" />
          <ellipse cx="86" cy="78" rx="7" ry="14" fill="#e8a898" transform="rotate(40 86 78)" />
          <ellipse cx="154" cy="78" rx="7" ry="14" fill="#e8a898" transform="rotate(-40 154 78)" />
          <ellipse cx="120" cy="104" rx="26" ry="32" fill="#e8a898" stroke={SKIN_EDGE} />
          <circle cx="120" cy="64" r="14" fill="#e8a898" stroke={SKIN_EDGE} />
          <path d="M110 66 q5 2 10 0" stroke="#5a3428" fill="none" />
          <path d="M108 52 Q120 44 132 52 Q120 48 108 52 Z" fill="#f0c8d8" stroke="#a87890" />
          <T x="16" y="156" size="4.4" fill={MARK}>A GIRL · NO CORD · CLEAR · NO MARK</T>
        </g>
      )}
    </Stage>
  )
}

/* ---------------------------------------------------------------- two clamps, then the cut */

function CordClamp({ x, y, bad }: { x: number; y: number; bad?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} style={{ pointerEvents: 'none' }}>
      <rect x="-4" y="-16" width="8" height="32" rx="1.5" fill={bad ? '#f8d0d4' : '#f4f4f8'} stroke={bad ? BAD : '#3878b8'} strokeWidth="1.3" />
      <rect x="-1.3" y="-7" width="2.6" height="14" fill={bad ? BAD : '#3878b8'} />
    </g>
  )
}

function CordRun({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  if (x2 - x1 < 2) return null
  return (
    <g style={{ pointerEvents: 'none' }}>
      <line x1={x1} x2={x2} y1={y} y2={y} stroke={CORD} strokeWidth="12" strokeLinecap="butt" />
      <line x1={x1} x2={x2} y1={y} y2={y} stroke={CORD_STRIPE} strokeWidth="12" strokeDasharray="2.4 4" />
    </g>
  )
}

/** The cord from the umbilicus. One tap places the clamp on the baby's side. */
export function ClampPicture({ run, onPick }: { run: NurseRun; onPick: (cm: number) => void }) {
  const svg = useRef<SVGSVGElement>(null)
  const p = CLAMP_PICTURE
  const xAt = (cm: number) => p.umbilicusX + cm * p.pxPerCm
  const placed = run.clampCm
  const close = placed !== null && placed < MIN_CLAMP_CM
  const secondCm = placed === null ? null : Math.min(placed + 1.6, (p.w - 18 - p.umbilicusX) / p.pxPerCm)
  const cut = placed !== null && !close && secondCm !== null && secondCm - placed >= 1.2
  return (
    <div className="mx-auto mb-2 max-w-[360px]" style={{ touchAction: 'none' }}>
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
        <rect width={p.w} height={p.h} fill="#e6eef2" />
        <ellipse cx="24" cy={p.cordY} rx="22" ry="28" fill="#e8a898" stroke={SKIN_EDGE} style={{ pointerEvents: 'none' }} />
        <circle cx={p.umbilicusX} cy={p.cordY} r="4.5" fill={MUCOSA} stroke={SKIN_EDGE} style={{ pointerEvents: 'none' }} />
        <path d={`M${p.w} 36 Q${p.w - 28} 48 ${p.w - 24} ${p.cordY} Q${p.w - 28} 78 ${p.w} 88`} fill={MUCOSA} stroke={MUCOSA_DEEP} style={{ pointerEvents: 'none' }} />
        <T x="4" y="14" size="4.2">BABY</T>
        <T x="196" y="14" size="4.2">MOTHER</T>
        {placed === null || !cut ? (
          <CordRun x1={p.umbilicusX} x2={p.w - 16} y={p.cordY} />
        ) : (
          <>
            <CordRun x1={p.umbilicusX} x2={xAt(placed) - 7} y={p.cordY} />
            <CordRun x1={xAt(secondCm!) + 7} x2={p.w - 16} y={p.cordY} />
          </>
        )}
        {[1, 2, 3, 4, 5].map((cm) => (
          <g key={cm} style={{ pointerEvents: 'none' }}>
            <line x1={xAt(cm)} x2={xAt(cm)} y1={p.cordY + 14} y2={p.cordY + 20} stroke={INK} strokeWidth="1" />
            <T x={xAt(cm) - 3} y={p.cordY + 30} size="4.4">{String(cm)}</T>
          </g>
        ))}
        <g style={{ pointerEvents: 'none' }}>
          <line x1={xAt(MIN_CLAMP_CM)} x2={xAt(MIN_CLAMP_CM)} y1={p.cordY - 22} y2={p.cordY + 20} stroke={MARK} strokeWidth="1.2" strokeDasharray="2 2" />
          <T x={xAt(MIN_CLAMP_CM) - 14} y={p.cordY - 26} size="4" fill={MARK}>2.5 cm</T>
        </g>
        {placed !== null && <CordClamp x={xAt(placed)} y={p.cordY} bad={close} />}
        {cut && secondCm !== null && (
          <g style={{ pointerEvents: 'none' }}>
            <CordClamp x={xAt(secondCm)} y={p.cordY} />
            <g transform={`translate(${(xAt(placed!) + xAt(secondCm)) / 2} ${p.cordY - 2}) rotate(-40)`}>
              <path d="M-8 -8 L2 2 M8 -8 L-2 2" stroke={METAL} strokeWidth="1.4" />
              <circle cx="-10" cy="-10" r="2.4" fill="none" stroke={METAL} />
              <circle cx="10" cy="-10" r="2.4" fill="none" stroke={METAL} />
            </g>
            <path d={`M${(xAt(placed!) + xAt(secondCm)) / 2} ${p.cordY + 6} q-1 6 1 10`} stroke={BLOOD} strokeWidth="1.2" fill="none" />
          </g>
        )}
        <T x="6" y={p.h - 6} size="4.2" fill={close ? BAD : placed === null ? INK : MARK}>
          {placed === null ? 'BABY SIDE, 2.5 cm OR FURTHER' : close ? `${placed.toFixed(1)} cm. TOO CLOSE` : `${placed.toFixed(1)} cm, THEN CUT BETWEEN`}
        </T>
      </svg>
    </div>
  )
}

/* ---------------------------------------------------------------- drug: feel, then the thigh */

export function DrugScene({ run, onPalpate, onInject, onFlag }: { run: NurseRun; onPalpate: () => void; onInject: () => void; onFlag: (key: 'drugTime' | 'edta' | 'clotted') => void }) {
  const early = run.drugEarly
  return (
    <Stage h={200}>
      <g style={{ pointerEvents: 'none' }}>
        <path d="M78 28 H210 Q226 90 200 140 H90 Q70 90 78 28 Z" fill={SKIN} stroke={SKIN_EDGE} />
        <path d="M8 70 H78 L86 150 H4 Z" fill={SKIN} stroke={SKIN_EDGE} />
        <ellipse cx="156" cy="22" rx="16" ry="10" fill="#e8a898" stroke={SKIN_EDGE} />
        <circle cx="156" cy="12" r="6" fill="#e8a898" stroke={SKIN_EDGE} />
        <path d="M150 8 Q156 2 162 8 Q156 6 150 8 Z" fill="#f0c8d8" />
        <T x="8" y="14" size="4">HER R THIGH</T>
      </g>
      <Hot id="nurse-palpate" x={90} y={32} w={130} h={84} on={run.palpated} onPress={onPalpate}>
        <ellipse cx="156" cy="74" rx={run.palpated ? 28 : 36} ry={run.palpated ? 26 : 22} fill={run.palpated ? '#c87060' : '#e8b0a0'} opacity="0.85" stroke="#a05040" strokeDasharray={run.palpated ? undefined : '3 2'} />
        {run.palpated && <path d="M136 70 q16 -14 28 2 q-8 16 -28 8" fill="#d8a090" stroke={SKIN_EDGE} />}
        {run.palpated && <T x="124" y="108" size="4" fill={MARK}>ONE BABY</T>}
      </Hot>
      {run.palpated && (
        <g style={{ pointerEvents: 'none' }}>
          <Hand x={124} y={78} angle={-60} scale={0.72} press />
          <Hand x={188} y={78} angle={60} scale={0.72} press />
        </g>
      )}
      <Hot id="nurse-syntometrine" x={8} y={40} w={70} h={96} on={run.syntometrine && !early} onPress={onInject}>
        <ellipse cx="40" cy="96" rx="22" ry="30" fill={early ? '#f3c2c6' : SKIN} stroke={early ? BAD : SKIN_EDGE} />
        <g transform="translate(40 78) rotate(-90)">
          <line x1="0" y1="0" x2="8" y2="0" stroke="#9098a8" strokeWidth="0.8" />
          <rect x="8" y="-3" width="26" height="6" fill="#f4f8fc" stroke="#6878a0" />
          <rect x={run.syntometrine ? 22 : 10} y="-2.2" width={run.syntometrine ? 8 : 20} height="4.4" fill={early ? '#f0b0b8' : '#d8e8f8'} />
          <rect x={run.syntometrine ? 30 : 32} y="-4" width="2" height="8" fill="#404858" />
        </g>
        <T x="14" y="128" size="3.6" fill={early ? BAD : INK}>{early ? 'TOO SOON' : run.syntometrine ? '1 ml IM' : '1 ml'}</T>
      </Hot>
      <Hot id="nurse-drug-time" x={8} y={148} w={52} h={46} on={run.drugTime} onPress={() => onFlag('drugTime')}>
        <circle cx="34" cy="168" r="16" fill={run.drugTime ? '#e5f5df' : '#fff'} stroke={run.drugTime ? MARK : INK} />
        <path d="M34 168 V158 M34 168 L42 172" stroke={INK} strokeWidth="1.2" />
        <T x="18" y="190" size="3.6">{run.drugTime ? 'NOTED' : 'TIME'}</T>
      </Hot>
      <Hot id="nurse-label-edta" x={66} y={148} w={80} h={46} on={run.edta} onPress={() => onFlag('edta')}>
        <rect x="86" y="156" width="22" height="30" rx="2" fill="#f4f4f8" stroke="#6878a0" />
        <rect x="88" y="152" width="18" height="6" fill="#6a3d8a" />
        {run.edta && <rect x="112" y="162" width="28" height="16" fill="#fff" stroke={MARK} />}
        <T x="114" y="174" size="3.6">{run.edta ? 'LAI' : 'EDTA'}</T>
      </Hot>
      <Hot id="nurse-label-clotted" x={152} y={148} w={80} h={46} on={run.clotted} onPress={() => onFlag('clotted')}>
        <rect x="168" y="156" width="22" height="30" rx="2" fill="#f4f4f8" stroke="#a86858" />
        <rect x="170" y="152" width="18" height="6" fill="#b03040" />
        {run.clotted && <rect x="194" y="162" width="28" height="16" fill="#fff" stroke={MARK} />}
        <T x="196" y="174" size="3.6">{run.clotted ? 'LAI' : 'TSH'}</T>
      </Hot>
    </Stage>
  )
}

/* ---------------------------------------------------------------- third stage: watch, do not pull */

export function MotherScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'gush' | 'lengthen' | 'fundus' | 'vessels' | 'bag' | 'padOn' | 'warm' | 'loss' | 'pulse') => void }) {
  const cordY2 = run.lengthen ? 154 : 142
  return (
    <Stage h={268}>
      <g style={{ pointerEvents: 'none' }}>
        <rect y="0" width="240" height="160" fill={DRAPE} />
        <ellipse cx="118" cy="86" rx="52" ry="44" fill={SKIN} stroke={SKIN_EDGE} />
        <path d="M0 8 Q40 24 36 80 Q32 130 14 160 L0 160 Z" fill={DRAPE_DARK} />
        <path d="M150 8 Q168 24 156 70 L150 8" fill={DRAPE_DARK} />
        <ellipse cx="118" cy="78" rx={run.lengthen ? 18 : 12} ry={run.lengthen ? 16 : 10} fill={MUCOSA} stroke={MUCOSA_DEEP} />
        {run.lengthen && <ellipse cx="118" cy="82" rx="12" ry="8" fill="#7a1424" stroke="#3a0810" />}
        <line x1="118" y1="86" x2="118" y2={cordY2} stroke={CORD} strokeWidth="6" />
        <line x1="118" y1="86" x2="118" y2={cordY2} stroke={CORD_STRIPE} strokeWidth="6" strokeDasharray="2 4" />
        <T x="6" y="14" size="4" fill="#f8f8f0">FROM THE FOOT</T>
      </g>
      <Hot id="nurse-sign-fundus" x={156} y={18} w={76} h={56} on={run.fundus} onPress={() => onFlag('fundus')}>
        <rect x="160" y="22" width="68" height="48" rx="3" fill={SKIN} stroke={INK} />
        <ellipse cx="194" cy={run.fundus ? 38 : 52} rx={run.fundus ? 12 : 18} ry={run.fundus ? 12 : 10} fill={run.fundus ? '#c87060' : '#e8b0a0'} stroke="#a05040" strokeDasharray={run.fundus ? undefined : '2 1.5'} />
        <T x="166" y="32" size="3.4">{run.fundus ? 'FIRM' : 'FUNDUS'}</T>
      </Hot>
      <Hot id="nurse-sign-gush" x={96} y={78} w={44} h={34} on={run.gush} onPress={() => onFlag('gush')}>
        <path d={run.gush ? 'M108 82 q-10 16 -4 26 q6 4 10 0 q4 8 8 -2 q-2 -16 -14 -24 Z' : 'M114 84 q-4 10 -1 16 q3 2 4 0 Z'} fill={BLOOD} opacity="0.9" />
      </Hot>
      <Hot id="nurse-sign-length" x={98} y={116} w={40} h={36} on={run.lengthen} onPress={() => onFlag('lengthen')} />
      <Hot id="nurse-vessels" x={162} y={96} w={70} h={56} on={run.vessels} onPress={() => onFlag('vessels')}>
        <circle cx="184" cy="124" r="16" fill="#eef0f4" stroke="#9aa0b8" />
        <circle cx="176" cy="128" r="4" fill="#b03040" stroke="#f0e0e0" strokeWidth="1.4" />
        <circle cx="192" cy="128" r="4" fill="#b03040" stroke="#f0e0e0" strokeWidth="1.4" />
        <ellipse cx="184" cy="116" rx="6" ry="4.5" fill="#6a2838" stroke="#f0e0e0" />
        <T x="166" y="148" size="3.4">{run.vessels ? '2 ART 1 VEIN' : 'CUT END'}</T>
      </Hot>
      <Hot id="nurse-bag" x={8} y={168} w={70} h={46} on={run.bag} onPress={() => onFlag('bag')}>
        <ellipse cx="32" cy="186" rx="14" ry="10" fill="#7a1424" stroke="#3a0810" />
        <path d="M16 180 H58 V206 H16 Z" fill="#dfe8ea" stroke="#607080" opacity="0.85" />
        {run.bag && <path d="M16 180 H58" stroke={MARK} strokeWidth="2" />}
        <T x="18" y="198" size="3.6">{run.bag ? 'SEALED' : 'BAG'}</T>
      </Hot>
      <Hot id="nurse-pad-on" x={84} y={168} w={72} h={46} on={run.padOn} onPress={() => onFlag('padOn')}>
        <rect x="96" y="180" width="48" height="22" rx="4" fill="#f7f7f2" stroke="#b0b0a4" />
        <path d="M100 191 h40" stroke="#7eb6e0" strokeWidth="3" />
        <T x="100" y="176" size="3.6">PAD</T>
      </Hot>
      <Hot id="nurse-warm" x={162} y={168} w={70} h={46} on={run.warm} onPress={() => onFlag('warm')}>
        <path d="M170 184 H224 L220 208 H166 Z" fill={run.warm ? '#f4f4ec' : '#e7d7c4'} stroke="#b8b8a8" />
        <path d="M174 192 h44 M172 200 h46" stroke="#dcdcd0" />
        <T x="176" y="180" size="3.6">BLANKET</T>
      </Hot>
      <Hot id="nurse-loss" x={8} y={220} w={70} h={42} on={run.loss} onPress={() => onFlag('loss')}>
        <path d="M24 228 H52 L48 254 H28 Z" fill="#e7eef2" stroke="#7a90a0" />
        <rect x="30" y="242" width="16" height="10" fill={BLOOD} opacity="0.75" />
        <T x="14" y="258" size="3.4" fill={run.loss ? MARK : INK}>{run.loss ? 'UNDER 500' : 'LOSS'}</T>
      </Hot>
      <Hot id="nurse-pulse" x={84} y={220} w={148} h={42} on={run.pulse} onPress={() => onFlag('pulse')}>
        <path d="M100 236 H200" stroke={SKIN} strokeWidth="10" strokeLinecap="round" />
        <path d="M120 228 v16 M132 226 v18" stroke="#efe3c8" strokeWidth="4" strokeLinecap="round" />
        <T x="150" y="248" size="3.8">{run.pulse ? 'PULSE STEADY' : 'HER WRIST'}</T>
      </Hot>
    </Stage>
  )
}

/* ---------------------------------------------------------------- leaving A&E */

export function HandoverScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'stable' | 'ward' | 'specimens' | 'papers' | 'escort') => void }) {
  return (
    <Stage h={220}>
      <g style={{ pointerEvents: 'none' }}>
        <rect x="8" y="70" width="150" height="8" fill="#c5ced6" />
        <circle cx="28" cy="86" r="6" fill="#8a929c" />
        <circle cx="130" cy="86" r="6" fill="#8a929c" />
      </g>
      <Hot id="nurse-stable" x={8} y={8} w={150} h={64} on={run.stable} onPress={() => onFlag('stable')}>
        <rect x="16" y="28" width="130" height="36" rx="4" fill="#e7eef2" stroke="#8aa0b0" />
        <circle cx="46" cy="40" r="10" fill={SKIN} stroke={SKIN_EDGE} />
        <path d="M36 36 Q46 28 56 36" fill={HAIR} />
        <ellipse cx="100" cy="46" rx="18" ry="12" fill="#e8a898" stroke={SKIN_EDGE} />
        <circle cx="100" cy="34" r="7" fill="#e8a898" stroke={SKIN_EDGE} />
        <T x="20" y="24" size="3.8">{run.stable ? 'BOTH STEADY' : 'MOTHER AND BABY'}</T>
      </Hot>
      <Hot id="nurse-ward" x={164} y={12} w={68} h={72} on={run.ward} onPress={() => onFlag('ward')}>
        <rect x="180" y="28" width="36" height="48" rx="4" fill="#2c2416" />
        <rect x="184" y="34" width="28" height="28" fill={run.ward ? '#d7f0e0' : '#8fd0c8'} />
        <T x="186" y="50" size="3.4" fill={INK}>{run.ward ? 'WARD' : 'CALL'}</T>
        <circle cx="198" cy="70" r="3" fill="#c8c0b0" />
      </Hot>
      <Hot id="nurse-specimens" x={8} y={112} w={108} h={48} on={run.specimens} onPress={() => onFlag('specimens')}>
        <rect x="14" y="124" width="96" height="28" rx="3" fill="#d5dde4" stroke="#7d8b98" />
        <rect x="22" y="128" width="10" height="16" fill="#f4f4f8" stroke="#6878a0" />
        <rect x="24" y="126" width="6" height="4" fill="#6a3d8a" />
        <rect x="38" y="128" width="10" height="16" fill="#f4f4f8" stroke="#a86858" />
        <rect x="40" y="126" width="6" height="4" fill="#b03040" />
        <rect x="56" y="130" width="22" height="16" fill="#dfe8ea" stroke="#607080" />
        <ellipse cx="67" cy="136" rx="6" ry="4" fill="#7a1424" />
        <T x="82" y="142" size="3.4">TRAY</T>
      </Hot>
      <Hot id="nurse-papers" x={124} y={112} w={108} h={48} on={run.papers} onPress={() => onFlag('papers')}>
        <rect x="136" y="122" width="40" height="30" fill="#fff" stroke={INK} />
        <rect x="168" y="126" width="40" height="28" fill="#fff8e8" stroke="#a09040" />
        <T x="140" y="140" size="3.4">NOTES</T>
        <T x="174" y="144" size="3.4">BBA</T>
      </Hot>
      <Hot id="nurse-escort" x={8} y={168} w={224} h={44} on={run.escort} onPress={() => onFlag('escort')}>
        <circle cx="36" cy="184" r="8" fill={SKIN} stroke={SKIN_EDGE} />
        <path d="M28 198 H48 L52 206 H24 Z" fill="#2f6fad" />
        <rect x="56" y="186" width="22" height="16" rx="2" fill="#b03040" />
        <rect x="88" y="184" width="16" height="24" rx="2" fill="#2c2416" />
        <rect x="90" y="188" width="12" height="10" fill="#8fd0c8" />
        <path d="M120 196 H210" stroke="#8a929c" strokeWidth="3" />
        <T x="120" y="188" size="3.8">WALK, BAG, PHONE</T>
      </Hot>
    </Stage>
  )
}


