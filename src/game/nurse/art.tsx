/**
 * The A&E nurse's view, from where she stands.
 * Nurse Chiu conducts. The pictures follow that job.
 *
 * Each frame is one shaded pixel picture. The words sit in the band under it.
 * Hit targets stay on the anatomy, in the same places.
 */
import { useRef, useState, type PointerEvent, type ReactNode, type Ref } from 'react'
import { toLocal } from '../bench/kit'
import { CLAMP_PICTURE, MIN_CLAMP_CM, cmAt, type NurseRun } from './model'

const FONT = 'Press Start 2P, monospace'
const INK = '#2c2416'
const CREAM = '#fff6ea'
const SKIN = '#f0c2a4'
const SKIN_DARK = '#d09878'
const SKIN_EDGE = '#8a5238'
const HI = '#f8dcc8'
const MUCOSA = '#d47078'
const MUCOSA_DEEP = '#8a3040'
const SCALP = '#e0b0a0'
const HAIR = '#3d2c22'
const HAIR_DARK = '#241810'
const HAIR_HI = '#6a5344'
const DRAPE = '#b9cdd8'
const DRAPE_DARK = '#8eacbc'
const CORD = '#e4e9f2'
const CORD_STRIPE = '#b7c0d2'
const BLOOD = '#9a1020'
const MARK = '#1d6b45'
const BAD = '#9a1020'
const METAL = '#9aa4b0'
const METAL_DARK = '#5c6770'
const GLOVE = '#f4ecd4'
const GLOVE_DARK = '#c8b890'
const GOWN = '#2a62a8'
const GOWN_DARK = '#1e4a80'
const BABY = '#f3c4b4'
const BABY_SHADE = '#e0a898'
const VERNIX = '#f7f3e4'

type Chip = { label: string; on: boolean }

function T({
  x,
  y,
  children,
  size = 8,
  fill = INK,
  anchor = 'start',
}: {
  x: number | string
  y: number | string
  children: string
  size?: number
  fill?: string
  anchor?: 'start' | 'middle'
}) {
  return (
    <text x={Number(x)} y={Number(y)} textAnchor={anchor} fontFamily={FONT} fontSize={size} fill={fill} style={{ pointerEvents: 'none' }}>
      {children}
    </text>
  )
}

function Pix({ children }: { children: ReactNode }) {
  return (
    <g shapeRendering="crispEdges" style={{ pointerEvents: 'none' }}>
      {children}
    </g>
  )
}

function Px({ x, y, w, h, c }: { x: number; y: number; w: number; h: number; c: string }) {
  return <rect x={x} y={y} width={w} height={h} fill={c} />
}

/** One row of a filled ellipse, so a round form stays on the pixel grid. */
function Ell({ cx, cy, rx, ry, c }: { cx: number; cy: number; rx: number; ry: number; c: string }) {
  if (rx <= 0.4 || ry <= 0.4) return null
  const y0 = Math.ceil(cy - ry)
  const y1 = Math.floor(cy + ry - 1e-6)
  const rows: ReactNode[] = []
  for (let y = y0; y <= y1; y++) {
    const ny = (y + 0.5 - cy) / ry
    const inside = 1 - ny * ny
    if (inside <= 0) continue
    const hx = rx * Math.sqrt(inside)
    const x0 = Math.ceil(cx - hx)
    const x1 = Math.floor(cx + hx - 1e-6)
    if (x1 >= x0) rows.push(<rect key={y} x={x0} y={y} width={x1 - x0 + 1} height={1} fill={c} />)
  }
  return <g>{rows}</g>
}

/** Outlined, shaded, with a highlight. The middle stays the fill colour. */
function Orb({
  cx,
  cy,
  rx,
  ry,
  fill,
  edge = SKIN_EDGE,
  hi,
  shade,
}: {
  cx: number
  cy: number
  rx: number
  ry: number
  fill: string
  edge?: string
  hi?: string
  shade?: string
}) {
  return (
    <g>
      <Ell cx={cx} cy={cy} rx={rx} ry={ry} c={edge} />
      <Ell cx={cx} cy={cy} rx={rx - 1.4} ry={ry - 1.4} c={fill} />
      {shade && <Ell cx={cx + rx * 0.2} cy={cy + ry * 0.28} rx={rx * 0.58} ry={ry * 0.46} c={shade} />}
      {shade && <Ell cx={cx - rx * 0.08} cy={cy - ry * 0.1} rx={rx * 0.48} ry={ry * 0.42} c={fill} />}
      {hi && <Ell cx={cx - rx * 0.3} cy={cy - ry * 0.34} rx={Math.max(1.2, rx * 0.24)} ry={Math.max(1.2, ry * 0.18)} c={hi} />}
    </g>
  )
}

function Shot({
  h,
  testId,
  legend,
  note,
  bad = false,
  children,
  svgRef,
  onPointerDown,
  style,
}: {
  h: number
  testId?: string
  legend?: Chip[]
  note?: string
  bad?: boolean
  children: ReactNode
  svgRef?: Ref<SVGSVGElement>
  onPointerDown?: (event: PointerEvent<SVGSVGElement>) => void
  style?: { touchAction: 'none' }
}) {
  return (
    <div className="nurse-shot" style={style}>
      <svg ref={svgRef} viewBox={`0 0 240 ${h}`} className="io-figure pixelated block w-full select-none" data-testid={testId} onPointerDown={onPointerDown}>
        <rect width="240" height={h} fill={CREAM} />
        {children}
      </svg>
      {(legend || note) && (
        <div className="nurse-caption">
          {legend && legend.length > 0 && (
            <ul className="nurse-legend">
              {legend.map((item) => (
                <li key={item.label} data-on={item.on ? '' : undefined}>
                  {item.label}
                </li>
              ))}
            </ul>
          )}
          {note && (
            <p className="nurse-say" data-bad={bad ? '' : undefined}>
              {note}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** Mrs Lai, facing you. x,y is the top of her hair. */
function PxFace({ x, y }: { x: number; y: number }) {
  const cx = x + 11
  const cy = y + 16
  return (
    <g>
      <Orb cx={cx} cy={cy} rx={12} ry={13} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
      <Ell cx={cx} cy={cy - 11} rx={12} ry={6} c={HAIR} />
      <Ell cx={cx} cy={cy - 14} rx={8} ry={4} c={HAIR_DARK} />
      <Px x={cx - 6} y={cy - 3} w={4} h={3} c="#1a1410" />
      <Px x={cx + 3} y={cy - 3} w={4} h={3} c="#1a1410" />
      <Px x={cx - 6} y={cy - 3} w={1} h={1} c="#fff" />
      <Px x={cx + 3} y={cy - 3} w={1} h={1} c="#fff" />
      <Px x={cx - 1} y={cy + 2} w={2} h={3} c={SKIN_DARK} />
      <Px x={cx - 4} y={cy + 6} w={8} h={2} c="#a04858" />
      <Ell cx={cx - 8} cy={cy + 1} rx={2} ry={3} c={SKIN_DARK} />
      <Ell cx={cx + 8} cy={cy + 1} rx={2} ry={3} c={SKIN_DARK} />
    </g>
  )
}

/** Back of the crowning head. Hair, a wet scalp, vernix. No face. */
function PxOcciput({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <Orb cx={cx} cy={cy} rx={16} ry={15} fill={HAIR} edge={HAIR_DARK} hi={HAIR_HI} />
      <Ell cx={cx} cy={cy + 9} rx={12} ry={5} c={SCALP} />
      <Ell cx={cx} cy={cy + 12} rx={8} ry={3} c="#c89888" />
      <Px x={cx - 6} y={cy - 8} w={2} h={12} c={HAIR_DARK} />
      <Px x={cx} y={cy - 10} w={2} h={16} c="#4a382c" />
      <Px x={cx + 6} y={cy - 6} w={2} h={10} c={HAIR_DARK} />
      <Px x={cx - 8} y={cy + 2} w={6} h={2} c={VERNIX} />
    </g>
  )
}

/** A newborn lying flexed. Big head, frog legs, arms by the cheeks. About 64 by 54. */
function PxNewborn({ x, y, back = false, hat = false }: { x: number; y: number; back?: boolean; hat?: boolean }) {
  return (
    <g>
      <Orb cx={x + 14} cy={y + 44} rx={13} ry={7} fill={BABY} edge="#a06050" hi="#f8d0c4" shade={BABY_SHADE} />
      <Orb cx={x + 50} cy={y + 44} rx={13} ry={7} fill={BABY} edge="#a06050" hi="#f8d0c4" shade={BABY_SHADE} />
      <Orb cx={x + 10} cy={y + 28} rx={9} ry={5} fill={BABY_SHADE} edge="#a06050" />
      <Orb cx={x + 54} cy={y + 28} rx={9} ry={5} fill={BABY_SHADE} edge="#a06050" />
      <Orb cx={x + 32} cy={y + 38} rx={15} ry={13} fill={BABY} edge="#a06050" hi="#f8d0c4" shade={BABY_SHADE} />
      <Orb cx={x + 18} cy={y + 20} rx={4} ry={5} fill={BABY_SHADE} edge="#a06050" />
      <Orb cx={x + 46} cy={y + 20} rx={4} ry={5} fill={BABY_SHADE} edge="#a06050" />
      <Orb cx={x + 32} cy={y + 16} rx={16} ry={14} fill={BABY} edge="#a06050" hi="#fbe0d4" shade={BABY_SHADE} />
      {hat ? (
        <>
          <Ell cx={x + 32} cy={y + 6} rx={15} ry={7} c="#e090a8" />
          <Ell cx={x + 32} cy={y + 5} rx={10} ry={3} c="#f4c0d0" />
        </>
      ) : (
        <>
          <Ell cx={x + 32} cy={y + 5} rx={14} ry={6} c={HAIR} />
          <Ell cx={x + 32} cy={y + 3} rx={9} ry={3} c={HAIR_DARK} />
        </>
      )}
      {back ? (
        <Px x={x + 31} y={y + 28} w={2} h={16} c={BABY_SHADE} />
      ) : (
        <>
          <Px x={x + 24} y={y + 14} w={4} h={3} c="#1a1410" />
          <Px x={x + 36} y={y + 14} w={4} h={3} c="#1a1410" />
          <Px x={x + 24} y={y + 14} w={1} h={1} c="#fff" />
          <Px x={x + 36} y={y + 14} w={1} h={1} c="#fff" />
          <Px x={x + 30} y={y + 18} w={4} h={2} c={BABY_SHADE} />
          <Px x={x + 28} y={y + 21} w={8} h={2} c="#c06070" />
        </>
      )}
    </g>
  )
}

/** Fingers point up. x,y is the top of the longest finger. About 22 wide. */
function PxGlove({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const finger = (fx: number, fy: number, h: number, c = GLOVE) => (
    <g>
      <Px x={fx} y={fy} w={5} h={h} c={GLOVE_DARK} />
      <Px x={fx + 1} y={fy + 1} w={3} h={h - 2} c={c} />
    </g>
  )
  const hand = (
    <g>
      {finger(1, 2, 12)}
      {finger(6, 0, 14, '#fbf6e6')}
      {finger(11, 2, 12)}
      {finger(16, 4, 9, GLOVE_DARK)}
      <Px x={0} y={12} w={22} h={10} c={GLOVE_DARK} />
      <Px x={1} y={13} w={20} h={8} c={GLOVE} />
      <Px x={3} y={14} w={6} h={3} c="#fff" />
      <Px x={4} y={20} w={14} h={3} c={GOWN} />
    </g>
  )
  return <g transform={flip ? `translate(${x + 22} ${y}) scale(-1 1)` : `translate(${x} ${y})`}>{hand}</g>
}

function PxNurse({ x, y, dressed }: { x: number; y: number; dressed: boolean }) {
  const cloth = dressed ? GOWN : '#6aaa88'
  const clothDark = dressed ? GOWN_DARK : '#3d6b58'
  return (
    <g>
      <Orb cx={x + 20} cy={y + 64} rx={8} ry={5} fill="#2a241c" edge={INK} />
      <Orb cx={x + 34} cy={y + 64} rx={8} ry={5} fill="#2a241c" edge={INK} />
      <Orb cx={x + 14} cy={y + 48} rx={7} ry={16} fill={cloth} edge={clothDark} />
      <Orb cx={x + 40} cy={y + 48} rx={7} ry={16} fill={dressed ? cloth : SKIN} edge={dressed ? clothDark : SKIN_EDGE} />
      <Orb cx={x + 27} cy={y + 46} rx={16} ry={22} fill={cloth} edge={clothDark} hi={dressed ? '#d6e8ff' : '#d7efe4'} />
      <Px x={x + 24} y={y + 32} w={6} h={16} c={dressed ? '#e7f2ff' : clothDark} />
      <PxFace x={x + 16} y={y} />
      {dressed && (
        <>
          <Px x={x + 22} y={y + 14} w={16} h={4} c="#9ec4da" />
          <Px x={x + 24} y={y + 15} w={4} h={2} c="#e8f6ff" />
          <Px x={x + 32} y={y + 15} w={4} h={2} c="#e8f6ff" />
          <Orb cx={x + 10} cy={y + 58} rx={6} ry={5} fill={GLOVE} edge={GLOVE_DARK} hi="#fff" />
          <Orb cx={x + 44} cy={y + 58} rx={6} ry={5} fill={GLOVE} edge={GLOVE_DARK} hi="#fff" />
        </>
      )}
    </g>
  )
}

function PxClock({ x, y, noted }: { x: number; y: number; noted: boolean }) {
  const cx = x + 16
  const cy = y + 16
  return (
    <g>
      <Ell cx={cx} cy={cy + 2} rx={16} ry={16} c={noted ? '#0e3d28' : INK} />
      <Ell cx={cx} cy={cy} rx={16} ry={16} c={noted ? MARK : INK} />
      <Ell cx={cx} cy={cy} rx={13} ry={13} c={noted ? '#e7f6e4' : '#fff'} />
      <Px x={cx - 1} y={cy - 8} w={2} h={9} c={INK} />
      <Px x={cx - 1} y={cy - 1} w={7} h={2} c={INK} />
      <Ell cx={cx} cy={cy} rx={2} ry={2} c={INK} />
    </g>
  )
}

function PxBottle({ x, y, cap }: { x: number; y: number; cap: string }) {
  return (
    <g>
      <Ell cx={x + 8} cy={y + 18} rx={8} ry={11} c={INK} />
      <Ell cx={x + 8} cy={y + 18} rx={6} ry={9} c="#f7f7fb" />
      <Ell cx={x + 6} cy={y + 16} rx={2} ry={5} c="#fff" />
      <Px x={x + 4} y={y + 2} w={8} h={8} c={cap} />
      <Px x={x + 5} y={y + 4} w={6} h={2} c="#fff" />
      <Ell cx={x + 8} cy={y + 8} rx={3} ry={2} c={cap} />
    </g>
  )
}

/** Horizontal 1 ml syringe. The needle points right. */
function PxSyringe({ x, y, pushed, bad }: { x: number; y: number; pushed: boolean; bad: boolean }) {
  return (
    <g>
      <Px x={x + 44} y={y + 4} w={12} h={2} c="#c5ccd4" />
      <Px x={x + 40} y={y + 2} w={5} h={6} c={METAL_DARK} />
      <Px x={x + 12} y={y} w={28} h={10} c={INK} />
      <Px x={x + 14} y={y + 2} w={24} h={6} c="#f4f8fc" />
      <Px x={x + (pushed ? 26 : 16)} y={y + 3} w={pushed ? 8 : 16} h={4} c={bad ? '#f0b0b8' : '#d5e6f6'} />
      <Px x={x + (pushed ? 20 : 6)} y={y - 2} w={4} h={14} c="#404858" />
      <Px x={x} y={y + 1} w={8} h={8} c="#404858" />
    </g>
  )
}

function PxForceps({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Px x={x} y={y} w={2} h={16} c={METAL} />
      <Px x={x + 5} y={y} w={2} h={16} c={METAL_DARK} />
      <Px x={x} y={y + 14} w={7} h={2} c={METAL} />
      <Ell cx={x + 1} cy={y + 18} rx={3} ry={3} c={METAL_DARK} />
      <Ell cx={x + 6} cy={y + 18} rx={3} ry={3} c={METAL} />
    </g>
  )
}

function Hot({ id, x, y, w, h, on, onPress }: { id: string; x: number; y: number; w: number; h: number; on: boolean; onPress: () => void }) {
  return (
    <g>
      <rect data-testid={id} x={x} y={y} width={w} height={h} fill="transparent" style={{ cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); onPress() }} />
      {on && <rect x={x + w - 8} y={y + 2} width={4} height={4} fill={MARK} style={{ pointerEvents: 'none' }} />}
    </g>
  )
}

function Dots({ n, i }: { n: number; i: number }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      {Array.from({ length: n }, (_, k) => {
        const cx = 120 + (k - (n - 1) / 2) * 14
        const s = k === i ? 6 : 4
        return <rect key={k} x={cx - s / 2} y={8} width={s} height={s} fill={k < i ? MARK : k === i ? INK : '#d3cbbd'} />
      })}
    </g>
  )
}

function CordH({ x, y, w }: { x: number; y: number; w: number }) {
  if (w < 2) return null
  return (
    <g>
      <Ell cx={x + 5} cy={y + 6} rx={6} ry={6} c="#9aa6bb" />
      <Ell cx={x + w - 5} cy={y + 6} rx={6} ry={6} c="#9aa6bb" />
      <Px x={x} y={y} w={w} h={12} c="#9aa6bb" />
      <Px x={x} y={y + 1} w={w} h={10} c={CORD} />
      {Array.from({ length: Math.floor(w / 8) }, (_, i) => (
        <Px key={i} x={x + 4 + i * 8} y={y + 3} w={3} h={6} c={CORD_STRIPE} />
      ))}
      <Px x={x} y={y + 2} w={w} h={2} c="#f7f9fc" />
    </g>
  )
}

/* ---------------------------------------------------------------- look */

/**
 * From the foot of the bed, lithotomy.
 * Hits stay put: head 120,78 r=18, perineum 120,124, anus 120,156, words at y=174.
 */
export function LookPicture({ run, onSign }: { run: NurseRun; onSign: (sign: 'crowning' | 'perineum' | 'anus' | 'push') => void }) {
  return (
    <Shot
      h={206}
      testId="nurse-picture"
      legend={[
        { label: 'Head stays', on: run.crowning },
        { label: 'Bulge', on: run.perineum },
        { label: 'Pouting', on: run.anus },
        { label: 'Push', on: run.push },
      ]}
      note="Her right is on your left."
    >
      <Pix>
        <Px x={8} y={8} w={224} h={158} c={DRAPE_DARK} />
        <Px x={12} y={12} w={216} h={150} c={DRAPE} />
        <Px x={16} y={16} w={208} h={8} c="#d5e6ee" />
        <Px x={6} y={36} w={6} h={40} c={METAL_DARK} />
        <Px x={6} y={32} w={18} h={6} c={METAL} />
        <Px x={228} y={36} w={6} h={40} c={METAL_DARK} />
        <Px x={214} y={32} w={18} h={6} c={METAL} />
        <Orb cx={46} cy={96} rx={34} ry={58} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
        <Orb cx={194} cy={96} rx={34} ry={58} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
        <Orb cx={28} cy={40} rx={12} ry={7} fill={SKIN} edge={SKIN_EDGE} hi={HI} />
        <Orb cx={212} cy={40} rx={12} ry={7} fill={SKIN} edge={SKIN_EDGE} hi={HI} />
        <Orb cx={120} cy={40} rx={30} ry={16} fill={SKIN_DARK} edge={SKIN_EDGE} hi={HI} />
        <Px x={108} y={28} w={3} h={8} c={HAIR_DARK} />
        <Px x={114} y={26} w={3} h={10} c={HAIR} />
        <Px x={120} y={28} w={3} h={8} c={HAIR_DARK} />
        <Px x={126} y={30} w={3} h={8} c={HAIR} />
        <Orb cx={98} cy={90} rx={8} ry={16} fill={MUCOSA} edge={MUCOSA_DEEP} hi="#f0a0a8" />
        <Orb cx={142} cy={90} rx={8} ry={16} fill={MUCOSA} edge={MUCOSA_DEEP} hi="#f0a0a8" />
        <PxOcciput cx={120} cy={78} />
        <Orb cx={120} cy={104} rx={8} ry={6} fill={MUCOSA} edge={MUCOSA_DEEP} />
        <Orb cx={120} cy={124} rx={32} ry={12} fill="#f6ece4" edge="#e4cfc2" hi="#fff" shade="#ecd8cc" />
        <Orb cx={120} cy={144} rx={14} ry={6} fill={SKIN} edge={SKIN_EDGE} hi={HI} />
        <Orb cx={120} cy={156} rx={8} ry={6} fill="#5c382c" edge="#2a1814" />
        <Px x={118} y={152} w={4} h={8} c="#241410" />
        <PxGlove x={99} y={30} />
        <Orb cx={176} cy={122} rx={14} ry={7} fill="#fbfbf6" edge="#d5d0c4" hi="#fff" />
        <PxGlove x={168} y={104} />
      </Pix>
      <g style={{ pointerEvents: 'none' }}>
        <Px x={112} y={168} w={16} h={8} c={run.push ? '#e7f6e4' : '#fff'} />
      </g>
      <ellipse data-testid="nurse-sign-perineum" cx="120" cy="124" rx="32" ry="12" fill="transparent" style={{ cursor: 'pointer' }} onPointerDown={() => onSign('perineum')} />
      <ellipse data-testid="nurse-sign-anus" cx="120" cy="156" rx="11" ry="8" fill="transparent" style={{ cursor: 'pointer' }} onPointerDown={() => onSign('anus')} />
      <g data-testid="nurse-sign-crowning" onPointerDown={() => onSign('crowning')} style={{ cursor: 'pointer' }}>
        <circle cx="120" cy="78" r="18" fill="transparent" />
      </g>
      <rect data-testid="nurse-sign-push" x="8" y="174" width="224" height="26" rx="4" fill={run.push ? '#e7f6e4' : '#fff'} stroke={run.push ? MARK : INK} strokeWidth="2" onPointerDown={() => onSign('push')} />
      <T x={120} y={191} size={8} anchor="middle" fill={run.push ? MARK : INK}>I HAVE TO PUSH</T>
    </Shot>
  )
}

/* ---------------------------------------------------------------- ask */

export function AskScene({ run, onAsk }: { run: NurseRun; onAsk: (key: 'liquorAsk' | 'allergy' | 'obstetric' | 'weeks') => void }) {
  const [line, setLine] = useState('Ask her.')
  function ask(key: 'liquorAsk' | 'allergy' | 'obstetric' | 'weeks', said: string) {
    setLine(said)
    onAsk(key)
  }
  return (
    <Shot
      h={196}
      legend={[
        { label: 'Weeks', on: run.weeks },
        { label: 'Belly', on: run.obstetric },
        { label: 'Arm', on: run.allergy },
        { label: 'Waters', on: run.liquorAsk },
      ]}
      note={line}
    >
      <Pix>
        <Px x={8} y={18} w={224} h={122} c="#d5e3ea" />
        <Px x={12} y={22} w={216} h={8} c="#f4f8fa" />
        <Orb cx={48} cy={86} rx={30} ry={16} fill="#f4f1e8" edge="#ddd4c4" hi="#fff" />
        <Orb cx={108} cy={84} rx={52} ry={18} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
        <Orb cx={117} cy={70} rx={26} ry={22} fill={run.obstetric ? '#f6d2c4' : SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
        <Ell cx={117} cy={74} rx={3} ry={3} c={MUCOSA_DEEP} />
        <PxFace x={32} y={46} />
        <Orb cx={178} cy={72} rx={40} ry={11} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
        <Orb cx={210} cy={66} rx={12} ry={10} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
        <Px x={206} y={56} w={4} h={8} c={SKIN_EDGE} />
        <Px x={207} y={57} w={2} h={6} c={SKIN} />
        <Px x={212} y={54} w={4} h={10} c={SKIN_EDGE} />
        <Px x={213} y={55} w={2} h={8} c={SKIN} />
        <Px x={218} y={58} w={4} h={8} c={SKIN_EDGE} />
        <Px x={219} y={59} w={2} h={6} c={SKIN} />
        <Px x={186} y={68} w={16} h={7} c="#f7f7fb" />
        <Px x={186} y={70} w={16} h={3} c="#3a78b8" />
        <Ell cx={78} cy={126} rx={22} ry={8} c="#b7daf0" />
        <Ell cx={120} cy={126} rx={28} ry={9} c="#c5e8f8" />
        <Ell cx={120} cy={124} rx={12} ry={3} c="#f4fcff" />
        <Ell cx={150} cy={130} rx={10} ry={4} c="#d7eef8" />
      </Pix>
      <Hot id="nurse-ask-weeks" x={14} y={34} w={58} h={62} on={run.weeks} onPress={() => ask('weeks', '39 weeks. My second.')} />
      <Hot id="nurse-ask-obstetric" x={78} y={40} w={78} h={64} on={run.obstetric} onPress={() => ask('obstetric', 'One baby. No scar. No bleed.')} />
      <Hot id="nurse-ask-allergy" x={164} y={36} w={66} h={70} on={run.allergy} onPress={() => ask('allergy', 'No allergies. No medicines.')} />
      <Hot id="nurse-ask-liquor" x={16} y={112} w={208} h={28} on={run.liquorAsk} onPress={() => ask('liquorAsk', 'The waters are clear.')} />
    </Shot>
  )
}

/* ---------------------------------------------------------------- prepare */

export function PrepareScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'ppe' | 'set' | 'pad' | 'drugOut' | 'bottles' | 'form' | 'explain' | 'consent') => void }) {
  return (
    <Shot
      h={250}
      legend={[
        { label: 'Gown', on: run.ppe },
        { label: 'Delivery set', on: run.set },
        { label: '1 ml out', on: run.drugOut },
        { label: '0.05% and pad', on: run.pad },
        { label: 'EDTA and TSH', on: run.bottles },
        { label: 'BBA form', on: run.form },
        { label: 'Staying', on: run.explain },
        { label: 'If a cut is needed', on: run.consent },
      ]}
      note="The ampoule is not given yet. You do not decide to cut."
    >
      <Pix>
        <Px x={84} y={16} w={148} h={6} c="#8d857c" />
        <Px x={88} y={22} w={140} h={108} c="#efe6da" />
        <Px x={92} y={26} w={132} h={48} c="#f6f1e8" />
        <Px x={92} y={82} w={132} h={42} c="#f3ece2" />
        <Px x={100} y={130} w={6} h={16} c={METAL_DARK} />
        <Px x={210} y={130} w={6} h={16} c={METAL_DARK} />
        <PxNurse x={8} y={12} dressed={run.ppe} />
        <Ell cx={123} cy={50} rx={30} ry={16} c="#6e7c88" />
        <Ell cx={123} cy={50} rx={26} ry={12} c="#e7eef2" />
        <Ell cx={116} cy={46} rx={8} ry={3} c="#fff" />
        {run.set ? (
          <>
            <PxForceps x={104} y={34} />
            <PxForceps x={118} y={36} />
            <Px x={132} y={40} w={2} h={12} c={METAL} />
            <Px x={138} y={40} w={2} h={12} c={METAL_DARK} />
            <Px x={130} y={50} w={12} h={2} c={METAL} />
            <Ell cx={132} cy={54} rx={3} ry={3} c="#e8eef2" />
            <Ell cx={140} cy={54} rx={3} ry={3} c="#e8eef2" />
          </>
        ) : (
          <>
            <Ell cx={123} cy={50} rx={16} ry={8} c="#3d6b58" />
            <Ell cx={123} cy={50} rx={12} ry={5} c="#d5ebe0" />
          </>
        )}
        <Ell cx={197} cy={52} rx={8} ry={16} c={INK} />
        <Ell cx={197} cy={54} rx={6} ry={13} c="#f4f0c8" />
        <Ell cx={197} cy={58} rx={4} ry={8} c="#e6c84a" />
        <Ell cx={197} cy={34} rx={3} ry={5} c="#d8d4c8" />
        <Orb cx={104} cy={104} rx={6} ry={14} fill="#d7eef8" edge="#2f6f96" hi="#f4fcff" />
        <Orb cx={132} cy={106} rx={18} ry={9} fill="#fbfbf6" edge="#d0cbb8" hi="#fff" />
        <Px x={120} y={106} w={24} h={2} c="#7eb6e0" />
        <PxBottle x={174} y={86} cap="#6a3d8a" />
        <PxBottle x={198} y={86} cap="#b03040" />
        <Px x={20} y={128} w={40} h={40} c={INK} />
        <Px x={22} y={130} w={36} h={36} c="#fff" />
        <Px x={26} y={138} w={28} h={2} c="#d9d0c4" />
        <Px x={26} y={144} w={22} h={2} c="#d9d0c4" />
        <Px x={26} y={150} w={26} h={2} c="#d9d0c4" />
        <Px x={26} y={156} w={16} h={2} c="#c4a24a" />
        <PxFace x={88} y={144} />
        <Orb cx={132} cy={174} rx={32} ry={10} fill={GOWN} edge={GOWN_DARK} hi="#d6e8ff" />
        <PxGlove x={152} y={152} />
        <Ell cx={34} cy={226} rx={7} ry={7} c={METAL_DARK} />
        <Ell cx={50} cy={226} rx={7} ry={7} c={METAL} />
        <Ell cx={34} cy={226} rx={4} ry={4} c="#e8eef2" />
        <Ell cx={50} cy={226} rx={4} ry={4} c="#f4f7fa" />
        <Px x={33} y={204} w={5} h={20} c={METAL_DARK} />
        <Px x={34} y={205} w={3} h={16} c={METAL} />
        <Px x={47} y={204} w={5} h={20} c={METAL_DARK} />
        <Px x={48} y={205} w={3} h={16} c="#d5dde4" />
        <Px x={34} y={214} w={18} h={4} c={METAL_DARK} />
        <PxFace x={108} y={200} />
      </Pix>
      <Hot id="nurse-ppe" x={6} y={8} w={72} h={108} on={run.ppe} onPress={() => onFlag('ppe')} />
      <Hot id="nurse-set" x={88} y={22} w={70} h={54} on={run.set} onPress={() => onFlag('set')} />
      <Hot id="nurse-drug-out" x={164} y={22} w={66} h={54} on={run.drugOut} onPress={() => onFlag('drugOut')} />
      <Hot id="nurse-pad" x={88} y={80} w={70} h={52} on={run.pad} onPress={() => onFlag('pad')} />
      <Hot id="nurse-bottles" x={164} y={80} w={66} h={52} on={run.bottles} onPress={() => onFlag('bottles')} />
      <Hot id="nurse-form" x={6} y={122} w={72} h={52} on={run.form} onPress={() => onFlag('form')} />
      <Hot id="nurse-explain" x={84} y={142} w={148} h={48} on={run.explain} onPress={() => onFlag('explain')} />
      <Hot id="nurse-consent" x={8} y={198} w={224} h={44} on={run.consent} onPress={() => onFlag('consent')} />
    </Shot>
  )
}

/* ---------------------------------------------------------------- birth */

function birthStep(run: NurseRun) {
  if (!run.time) return 0
  if (!run.cord) return 1
  if (!run.liquor) return 2
  if (!run.shown) return 3
  if (!run.birthmark) return 4
  return 5
}

const BIRTH_NOTE = [
  'Nurse Chiu delivers. Call the time.',
  'The cord lies on the chest. No loop on the neck.',
  'The liquor on the pad is clear.',
  'Turn her so the mother can see. She says a girl.',
  'Look over the skin. No birthmark.',
  'A girl. No cord on the neck. Clear liquor. No birthmark.',
]

export function BirthScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'time' | 'cord' | 'liquor' | 'shown' | 'birthmark') => void }) {
  const step = birthStep(run)
  return (
    <Shot h={176} note={BIRTH_NOTE[step]}>
      <Dots n={6} i={step} />
      {step === 0 && (
        <>
          <Pix>
            <Px x={8} y={24} w={224} h={140} c="#e7eef2" />
            <PxClock x={18} y={56} noted={false} />
            <Orb cx={176} cy={78} rx={18} ry={28} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
            <Orb cx={210} cy={86} rx={14} ry={24} fill={SKIN} edge={SKIN_EDGE} hi={HI} />
            <PxOcciput cx={176} cy={96} />
            <Orb cx={176} cy={118} rx={12} ry={6} fill={MUCOSA} edge={MUCOSA_DEEP} />
            <PxGlove x={150} y={78} />
            <PxGlove x={188} y={96} flip />
          </Pix>
          <Hot id="nurse-time" x={8} y={48} w={56} h={64} on={false} onPress={() => onFlag('time')} />
        </>
      )}
      {step === 1 && (
        <>
          <Pix>
            <Px x={0} y={20} w={240} h={156} c="#f6efe8" />
            <Orb cx={120} cy={118} rx={84} ry={36} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
            <Orb cx={120} cy={78} rx={14} ry={16} fill={SKIN} edge={SKIN_EDGE} hi={HI} />
            <Orb cx={120} cy={46} rx={28} ry={24} fill={BABY} edge="#a06050" hi="#fbe0d4" shade={BABY_SHADE} />
            <Ell cx={120} cy={28} rx={22} ry={8} c={HAIR} />
            <Ell cx={120} cy={24} rx={14} ry={4} c={HAIR_DARK} />
            <Px x={108} y={44} w={4} h={3} c="#1a1410" />
            <Px x={128} y={44} w={4} h={3} c="#1a1410" />
            <Px x={108} y={44} w={1} h={1} c="#fff" />
            <Px x={128} y={44} w={1} h={1} c="#fff" />
            <Px x={116} y={50} w={8} h={2} c="#c06070" />
            <Ell cx={112} cy={112} rx={5} ry={5} c={MUCOSA_DEEP} />
            <CordH x={108} y={108} w={96} />
          </Pix>
          <Hot id="nurse-cord" x={88} y={96} w={64} h={36} on={false} onPress={() => onFlag('cord')} />
        </>
      )}
      {step === 2 && (
        <>
          <Pix>
            <Px x={0} y={20} w={240} h={156} c={DRAPE} />
            <Orb cx={40} cy={96} rx={26} ry={44} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
            <Orb cx={200} cy={96} rx={26} ry={44} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
            <Orb cx={120} cy={72} rx={20} ry={16} fill={MUCOSA} edge={MUCOSA_DEEP} hi="#f0a0a8" />
            <Orb cx={120} cy={118} rx={40} ry={12} fill="#fbfbf6" edge="#d4d0c4" hi="#fff" />
            <Ell cx={120} cy={134} rx={32} ry={11} c="#b9e2f4" />
            <Ell cx={120} cy={132} rx={14} ry={4} c="#f4fcff" />
            <Ell cx={104} cy={138} rx={6} ry={3} c="#d7eef8" />
          </Pix>
          <Hot id="nurse-liquor" x={78} y={120} w={84} h={28} on={false} onPress={() => onFlag('liquor')} />
        </>
      )}
      {step === 3 && (
        <>
          <Pix>
            <Px x={0} y={20} w={240} h={156} c="#d5e4ea" />
            <Orb cx={120} cy={110} rx={100} ry={48} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
            <PxFace x={164} y={48} />
            <PxNewborn x={88} y={64} />
            <PxGlove x={58} y={70} />
            <PxGlove x={160} y={72} flip />
          </Pix>
          <Hot id="nurse-show" x={70} y={58} w={100} h={90} on={false} onPress={() => onFlag('shown')} />
        </>
      )}
      {step === 4 && (
        <>
          <Pix>
            <Px x={16} y={28} w={208} h={132} c="#f6efe8" />
            <Px x={28} y={40} w={184} h={108} c="#f3e6dc" />
            <PxNewborn x={88} y={52} back />
          </Pix>
          <Hot id="nurse-look" x={48} y={40} w={144} h={110} on={false} onPress={() => onFlag('birthmark')} />
        </>
      )}
      {step === 5 && (
        <Pix>
          <Px x={0} y={20} w={240} h={156} c="#d5e4ea" />
          <Orb cx={120} cy={108} rx={104} ry={48} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
          <PxFace x={20} y={52} />
          <Orb cx={78} cy={102} rx={34} ry={12} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
          <Orb cx={164} cy={102} rx={34} ry={12} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
          <Orb cx={28} cy={150} rx={18} ry={8} fill="#f0c8d8" edge="#d090a8" />
          <Orb cx={212} cy={150} rx={18} ry={8} fill="#f0c8d8" edge="#d090a8" />
          <PxNewborn x={88} y={62} hat />
        </Pix>
      )}
    </Shot>
  )
}

/* ---------------------------------------------------------------- clamp */

function CordClamp({ x, y, bad }: { x: number; y: number; bad?: boolean }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      <Px x={x - 6} y={y - 18} w={12} h={36} c={bad ? '#5a0810' : '#1e4a80'} />
      <Px x={x - 4} y={y - 16} w={8} h={32} c={bad ? BAD : '#3878b8'} />
      <Px x={x - 2} y={y - 14} w={4} h={28} c={bad ? '#f8d0d4' : '#f7f7fb'} />
      <Px x={x - 1} y={y - 8} w={2} h={16} c={bad ? BAD : '#3878b8'} />
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
  const mid = cut && secondCm !== null && placed !== null ? (xAt(placed) + xAt(secondCm)) / 2 : 0
  const note = placed === null ? 'Tap the baby side, 2.5 cm or further from the umbilicus.' : close ? `${placed.toFixed(1)} cm is too close.` : `${placed.toFixed(1)} cm. A second clamp, then cut between them.`
  return (
    <Shot
      h={p.h}
      testId="nurse-clamp-picture"
      svgRef={svg}
      style={{ touchAction: 'none' }}
      bad={close}
      note={note}
      onPointerDown={(e) => {
        const pt = toLocal(svg.current, e)
        if (!pt) return
        const cm = cmAt(pt.x, pt.y)
        if (cm === null) return
        onPick(cm)
      }}
    >
      <Pix>
        <Px x={0} y={28} w={240} h={64} c="#e7eef2" />
        <Orb cx={22} cy={74} rx={14} ry={14} fill={BABY} edge="#a06050" shade={BABY_SHADE} />
        <Orb cx={20} cy={54} rx={13} ry={12} fill={BABY} edge="#a06050" shade={BABY_SHADE} />
        <Ell cx={20} cy={44} rx={12} ry={6} c={HAIR} />
        <Ell cx={20} cy={41} rx={8} ry={3} c={HAIR_DARK} />
        <Orb cx={48} cy={62} rx={5} ry={5} fill={MUCOSA_DEEP} edge="#6a2830" />
        <Orb cx={222} cy={64} rx={16} ry={22} fill={SKIN} edge={SKIN_EDGE} hi={HI} />
        <Orb cx={224} cy={64} rx={7} ry={10} fill={MUCOSA} edge={MUCOSA_DEEP} />
        {placed === null || !cut ? (
          <CordH x={p.umbilicusX} y={p.cordY - 6} w={p.w - 16 - p.umbilicusX} />
        ) : (
          <>
            <CordH x={p.umbilicusX} y={p.cordY - 6} w={xAt(placed) - 7 - p.umbilicusX} />
            <CordH x={xAt(secondCm!) + 7} y={p.cordY - 6} w={p.w - 16 - (xAt(secondCm!) + 7)} />
          </>
        )}
        {[1, 2, 3, 4, 5].map((cm) => (
          <Px key={cm} x={xAt(cm)} y={p.cordY + 14} w={2} h={6} c={INK} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <Px key={i} x={xAt(MIN_CLAMP_CM)} y={p.cordY - 22 + i * 4} w={2} h={2} c={MARK} />
        ))}
        {cut && (
          <>
            <Px x={mid - 10} y={p.cordY - 18} w={4} h={4} c={METAL_DARK} />
            <Px x={mid + 6} y={p.cordY - 18} w={4} h={4} c={METAL_DARK} />
            <Px x={mid - 8} y={p.cordY - 14} w={2} h={12} c={METAL} />
            <Px x={mid + 6} y={p.cordY - 14} w={2} h={12} c={METAL} />
            <Px x={mid - 6} y={p.cordY - 4} w={12} h={2} c={METAL_DARK} />
            <Ell cx={mid} cy={p.cordY + 12} rx={3} ry={3} c={BLOOD} />
          </>
        )}
      </Pix>
      {placed !== null && <CordClamp x={xAt(placed)} y={p.cordY} bad={close} />}
      {cut && secondCm !== null && <CordClamp x={xAt(secondCm)} y={p.cordY} />}
      <g style={{ pointerEvents: 'none' }}>
        <T x="8" y="16" size={7}>BABY</T>
        <T x="188" y="16" size={7}>MOTHER</T>
        <T x={xAt(MIN_CLAMP_CM)} y={18} size={7} anchor="middle" fill={MARK}>2.5</T>
        {[1, 2, 3, 4, 5].map((cm) => (
          <T key={cm} x={xAt(cm) + 1} y={p.h - 8} size={7} anchor="middle">{String(cm)}</T>
        ))}
      </g>
    </Shot>
  )
}

/* ---------------------------------------------------------------- drug */

export function DrugScene({ run, onPalpate, onInject, onFlag }: { run: NurseRun; onPalpate: () => void; onInject: () => void; onFlag: (key: 'drugTime' | 'edta' | 'clotted') => void }) {
  const early = run.drugEarly
  const note = early ? 'Too soon. Feel for one baby before the injection.' : run.syntometrine ? 'Syntometrine 1 ml is in the muscle. Label both bottles Lai.' : run.palpated ? 'One baby. Give 1 ml into the right thigh.' : 'Both hands on the abdomen before any injection.'
  return (
    <Shot
      h={200}
      bad={early}
      legend={[
        { label: 'One baby', on: run.palpated },
        { label: '1 ml IM', on: run.syntometrine && !early },
        { label: 'Time', on: run.drugTime },
        { label: run.edta ? 'EDTA Lai' : 'EDTA', on: run.edta },
        { label: run.clotted ? 'TSH Lai' : 'TSH', on: run.clotted },
      ]}
      note={note}
    >
      <Pix>
        <Orb cx={156} cy={72} rx={66} ry={52} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
        <Orb cx={168} cy={22} rx={16} ry={12} fill={BABY} edge="#a06050" hi="#f8d0c4" shade={BABY_SHADE} />
        <Ell cx={168} cy={12} rx={10} ry={5} c="#e090a8" />
        <Px x={162} y={20} w={3} h={2} c="#1a1410" />
        <Px x={172} y={20} w={3} h={2} c="#1a1410" />
        {run.palpated ? (
          <Orb cx={156} cy={74} rx={26} ry={16} fill="#c87060" edge="#8a4038" hi="#e8a898" shade="#a05040" />
        ) : (
          <Orb cx={156} cy={74} rx={34} ry={20} fill="#f0c0b0" edge={SKIN_EDGE} hi="#f8d4c8" shade="#e0a090" />
        )}
        {run.palpated && (
          <>
            <PxGlove x={112} y={58} />
            <PxGlove x={176} y={58} flip />
          </>
        )}
        <Orb cx={42} cy={92} rx={30} ry={42} fill={early ? '#f4c4c8' : SKIN} edge={early ? BAD : SKIN_EDGE} hi={early ? '#f8d0d4' : HI} shade={early ? '#e09098' : SKIN_DARK} />
        <Orb cx={42} cy={128} rx={16} ry={8} fill={early ? '#e8a8ae' : SKIN_DARK} edge={early ? BAD : SKIN_EDGE} />
        <PxSyringe x={12} y={78} pushed={run.syntometrine} bad={early} />
        <PxClock x={16} y={150} noted={run.drugTime} />
        <PxBottle x={92} y={150} cap="#6a3d8a" />
        <PxBottle x={176} y={150} cap="#b03040" />
        {run.edta && <Px x={96} y={162} w={20} h={12} c="#fff" />}
        {run.clotted && <Px x={180} y={162} w={20} h={12} c="#fff" />}
      </Pix>
      <Hot id="nurse-palpate" x={90} y={32} w={130} h={84} on={run.palpated} onPress={onPalpate} />
      <Hot id="nurse-syntometrine" x={8} y={40} w={70} h={96} on={run.syntometrine && !early} onPress={onInject} />
      <Hot id="nurse-drug-time" x={8} y={148} w={52} h={46} on={run.drugTime} onPress={() => onFlag('drugTime')} />
      <Hot id="nurse-label-edta" x={66} y={148} w={80} h={46} on={run.edta} onPress={() => onFlag('edta')} />
      <Hot id="nurse-label-clotted" x={152} y={148} w={80} h={46} on={run.clotted} onPress={() => onFlag('clotted')} />
    </Shot>
  )
}

/* ---------------------------------------------------------------- mother */

export function MotherScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'gush' | 'lengthen' | 'fundus' | 'vessels' | 'bag' | 'padOn' | 'warm' | 'loss' | 'pulse') => void }) {
  const cordY2 = run.lengthen ? 154 : 142
  return (
    <Shot
      h={268}
      legend={[
        { label: 'Gush', on: run.gush },
        { label: 'Longer cord', on: run.lengthen },
        { label: 'Firm fundus', on: run.fundus },
        { label: 'Two arteries, one vein', on: run.vessels },
        { label: 'Bag', on: run.bag },
        { label: 'Pad', on: run.padOn },
        { label: 'Blanket', on: run.warm },
        { label: 'Under 500', on: run.loss },
        { label: 'Pulse', on: run.pulse },
      ]}
      note="It separates on its own. Two arteries and one vein. Do not pull."
    >
      <Pix>
        <Px x={4} y={8} w={148} h={152} c={DRAPE_DARK} />
        <Px x={8} y={12} w={140} h={144} c={DRAPE} />
        <Orb cx={32} cy={82} rx={20} ry={46} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
        <Orb cx={138} cy={82} rx={14} ry={46} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
        <Orb cx={104} cy={74} rx={16} ry={14} fill={run.lengthen ? MUCOSA : MUCOSA_DEEP} edge={MUCOSA_DEEP} hi="#f0a0a8" />
        {run.lengthen && <Ell cx={104} cy={76} rx={8} ry={6} c="#7a1424" />}
        <Px x={113} y={86} w={10} h={cordY2 - 86} c="#9aa6bb" />
        <Px x={114} y={86} w={8} h={cordY2 - 86} c={CORD} />
        {Array.from({ length: Math.floor((cordY2 - 86) / 6) }, (_, i) => (
          <Px key={i} x={114} y={86 + i * 6} w={8} h={2} c={CORD_STRIPE} />
        ))}
        <Px x={116} y={86} w={2} h={cordY2 - 86} c="#f7f9fc" />
        <Orb cx={118} cy={95} rx={run.gush ? 9 : 5} ry={run.gush ? 11 : 5} fill={BLOOD} edge="#6a0818" hi="#e05060" />
        <Px x={158} y={20} w={74} h={52} c={INK} />
        <Px x={160} y={22} w={70} h={48} c="#fffaf3" />
        <Orb cx={196} cy={run.fundus ? 44 : 50} rx={run.fundus ? 14 : 20} ry={run.fundus ? 11 : 14} fill={run.fundus ? '#c87060' : '#f0c0b0'} edge={run.fundus ? '#8a4038' : SKIN_EDGE} hi={run.fundus ? '#e8a898' : '#f8d4c8'} />
        <Px x={164} y={98} w={68} h={52} c={INK} />
        <Px x={166} y={100} w={64} h={48} c="#fffaf3" />
        <Orb cx={197} cy={124} rx={24} ry={18} fill="#f4f1ea" edge="#b0a898" hi="#fff" />
        <Orb cx={184} cy={128} rx={6} ry={6} fill="#e07078" edge="#8a2830" hi="#f4b0b4" />
        <Orb cx={210} cy={128} rx={6} ry={6} fill="#e07078" edge="#8a2830" hi="#f4b0b4" />
        <Orb cx={197} cy={114} rx={8} ry={7} fill="#6a2838" edge="#3a1420" hi="#a05060" />
        <Orb cx={43} cy={190} rx={22} ry={16} fill={run.bag ? '#dfe8ea' : '#8aa0ae'} edge="#607080" hi="#fff" />
        <Ell cx={43} cy={192} rx={12} ry={8} c="#7a1424" />
        {run.bag && <Px x={24} y={180} w={38} h={3} c={MARK} />}
        <Orb cx={120} cy={192} rx={24} ry={12} fill="#fbfbf6" edge="#d0cbb8" hi="#fff" />
        <Px x={104} y={192} w={32} h={2} c="#7eb6e0" />
        <Orb cx={197} cy={192} rx={26} ry={14} fill={run.warm ? '#f7f4ea' : '#e7d3bc'} edge="#c4b09a" hi="#fff" />
        <Px x={176} y={188} w={42} h={2} c="#e4d8c8" />
        <Px x={178} y={194} w={38} h={2} c="#e4d8c8" />
        <Orb cx={43} cy={242} rx={16} ry={14} fill="#e7eef2" edge="#7a90a0" hi="#fff" />
        <Ell cx={43} cy={248} rx={10} ry={5} c={BLOOD} />
        <Orb cx={156} cy={242} rx={52} ry={8} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
        <Orb cx={118} cy={232} rx={4} ry={10} fill={GLOVE} edge={GLOVE_DARK} hi="#fff" />
        <Orb cx={130} cy={230} rx={4} ry={11} fill="#fbf6e6" edge={GLOVE_DARK} hi="#fff" />
      </Pix>
      <Hot id="nurse-sign-fundus" x={156} y={18} w={76} h={56} on={run.fundus} onPress={() => onFlag('fundus')} />
      <Hot id="nurse-sign-gush" x={96} y={78} w={44} h={34} on={run.gush} onPress={() => onFlag('gush')} />
      <Hot id="nurse-sign-length" x={98} y={116} w={40} h={36} on={run.lengthen} onPress={() => onFlag('lengthen')} />
      <Hot id="nurse-vessels" x={162} y={96} w={70} h={56} on={run.vessels} onPress={() => onFlag('vessels')} />
      <Hot id="nurse-bag" x={8} y={168} w={70} h={46} on={run.bag} onPress={() => onFlag('bag')} />
      <Hot id="nurse-pad-on" x={84} y={168} w={72} h={46} on={run.padOn} onPress={() => onFlag('padOn')} />
      <Hot id="nurse-warm" x={162} y={168} w={70} h={46} on={run.warm} onPress={() => onFlag('warm')} />
      <Hot id="nurse-loss" x={8} y={220} w={70} h={42} on={run.loss} onPress={() => onFlag('loss')} />
      <Hot id="nurse-pulse" x={84} y={220} w={148} h={42} on={run.pulse} onPress={() => onFlag('pulse')} />
    </Shot>
  )
}

/* ---------------------------------------------------------------- handover */

export function HandoverScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'stable' | 'ward' | 'specimens' | 'papers' | 'escort') => void }) {
  return (
    <Shot
      h={220}
      legend={[
        { label: 'Both stable', on: run.stable },
        { label: 'Phone the ward', on: run.ward },
        { label: 'Bottles and placenta', on: run.specimens },
        { label: 'Notes and BBA', on: run.papers },
        { label: 'Walk with them', on: run.escort },
      ]}
      note="The bag and a phone go with her."
    >
      <Pix>
        <Px x={14} y={36} w={130} h={28} c="#d5dee6" />
        <Px x={18} y={32} w={46} h={10} c="#f4f1e8" />
        <Orb cx={40} cy={30} rx={14} ry={12} fill={SKIN} edge={SKIN_EDGE} hi={HI} shade={SKIN_DARK} />
        <Ell cx={40} cy={20} rx={10} ry={5} c={HAIR} />
        <Px x={34} y={28} w={3} h={2} c="#1a1410" />
        <Px x={44} y={28} w={3} h={2} c="#1a1410" />
        <Orb cx={96} cy={34} rx={16} ry={12} fill={BABY} edge="#a06050" hi="#f8d0c4" />
        <Ell cx={96} cy={24} rx={10} ry={5} c="#e090a8" />
        <Px x={90} y={32} w={3} h={2} c="#1a1410" />
        <Px x={100} y={32} w={3} h={2} c="#1a1410" />
        <Px x={182} y={22} w={32} h={52} c={INK} />
        <Px x={184} y={24} w={28} h={48} c={run.ward ? '#d7f0e0' : '#e7f6f4'} />
        <Px x={188} y={28} w={20} h={28} c="#20324a" />
        <Px x={190} y={30} w={8} h={2} c="#9ad8ff" />
        <Ell cx={198} cy={64} rx={4} ry={3} c={INK} />
        <Px x={14} y={118} w={96} h={36} c="#7d8b98" />
        <Px x={18} y={122} w={88} h={28} c="#e7eef2" />
        <PxBottle x={24} y={118} cap="#6a3d8a" />
        <PxBottle x={44} y={118} cap="#b03040" />
        <Orb cx={86} cy={136} rx={12} ry={8} fill="#dfe8ea" edge="#607080" />
        <Ell cx={86} cy={136} rx={6} ry={4} c="#7a1424" />
        <Px x={132} y={116} w={44} h={40} c={INK} />
        <Px x={134} y={118} w={40} h={36} c="#fff" />
        <Px x={140} y={126} w={28} h={2} c="#d9d0c4" />
        <Px x={140} y={132} w={22} h={2} c="#d9d0c4" />
        <Px x={140} y={138} w={24} h={2} c="#d9d0c4" />
        <Px x={186} y={118} w={40} h={36} c="#a09040" />
        <Px x={188} y={120} w={36} h={32} c="#fff8e8" />
        <Px x={194} y={128} w={24} h={2} c="#c8b060" />
        <Px x={194} y={134} w={18} h={2} c="#c8b060" />
        <PxFace x={8} y={174} />
        <Orb cx={30} cy={204} rx={18} ry={8} fill={GOWN} edge={GOWN_DARK} hi="#d6e8ff" />
        <Orb cx={54} cy={200} rx={12} ry={9} fill="#b03040" edge="#7a1828" hi="#e05060" />
        <Px x={74} y={184} w={16} h={28} c={INK} />
        <Px x={76} y={186} w={12} h={18} c={run.escort ? '#d7f0e0' : '#e7f6f4'} />
        <Px x={78} y={190} w={8} h={10} c="#20324a" />
        <Ell cx={82} cy={208} rx={3} ry={2} c={INK} />
        <Px x={130} y={204} w={96} h={4} c="#8a929c" />
        <Px x={140} y={198} w={14} h={6} c="#c5ced6" />
        <Px x={164} y={198} w={14} h={6} c="#c5ced6" />
        <Px x={188} y={198} w={14} h={6} c="#c5ced6" />
      </Pix>
      <Hot id="nurse-stable" x={8} y={8} w={150} h={64} on={run.stable} onPress={() => onFlag('stable')} />
      <Hot id="nurse-ward" x={164} y={12} w={68} h={72} on={run.ward} onPress={() => onFlag('ward')} />
      <Hot id="nurse-specimens" x={8} y={112} w={108} h={48} on={run.specimens} onPress={() => onFlag('specimens')} />
      <Hot id="nurse-papers" x={124} y={112} w={108} h={48} on={run.papers} onPress={() => onFlag('papers')} />
      <Hot id="nurse-escort" x={8} y={168} w={224} h={44} on={run.escort} onPress={() => onFlag('escort')} />
    </Shot>
  )
}
