/**
 * The A&E nurse's view, from where she stands.
 * Nurse Chiu conducts. The pictures follow that job.
 *
 * Each picture is one fixed-view projection of a voxel volume.
 * Hit targets stay on the anatomy, in the same places.
 */
import { useMemo, useRef, useState, type PointerEvent, type ReactNode, type Ref } from 'react'
import { toLocal } from '../bench/kit'
import { CLAMP_PICTURE, MIN_CLAMP_CM, cmAt, type NurseRun } from './model'
import { picture, sceneKey, type Scene } from './volume'

const FONT = 'Press Start 2P, monospace'
const INK = '#2c2416'
const MARK = '#1d6b45'
const BAD = '#9a1020'

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

function Vol({ scene, w, h }: { scene: Scene; w: number; h: number }) {
  const key = sceneKey(scene)
  const href = useMemo(() => picture(scene), [key])
  return <image href={href} x={0} y={0} width={w} height={h} preserveAspectRatio="none" style={{ pointerEvents: 'none', imageRendering: 'pixelated' }} />
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
        <rect width="240" height={h} fill="#fff6ea" />
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

function CordClamp({ x, y, bad }: { x: number; y: number; bad?: boolean }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={x - 6} y={y - 18} width={12} height={36} fill={bad ? '#5a0810' : '#1e4a80'} />
      <rect x={x - 4} y={y - 16} width={8} height={32} fill={bad ? BAD : '#3878b8'} />
      <rect x={x - 2} y={y - 14} width={4} height={28} fill={bad ? '#f8d0d4' : '#f7f7fb'} />
      <rect x={x - 1} y={y - 8} width={2} height={16} fill={bad ? BAD : '#3878b8'} />
    </g>
  )
}

/* ---------------------------------------------------------------- look */

/**
 * From the foot of the bed, lithotomy.
 * Hits stay put: head (120, 78) r=18, perineum (120, 124), anus (120, 156), words at y=174.
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
      <Vol scene={{ kind: 'look' }} w={240} h={206} />
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
      <Vol scene={{ kind: 'ask' }} w={240} h={196} />
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
      <Vol scene={{ kind: 'prepare', dressed: run.ppe, openSet: run.set }} w={240} h={250} />
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
      <Vol scene={{ kind: 'birth', step }} w={240} h={176} />
      <Dots n={6} i={step} />
      {step === 0 && <Hot id="nurse-time" x={8} y={48} w={56} h={64} on={false} onPress={() => onFlag('time')} />}
      {step === 1 && <Hot id="nurse-cord" x={88} y={96} w={64} h={36} on={false} onPress={() => onFlag('cord')} />}
      {step === 2 && <Hot id="nurse-liquor" x={78} y={120} w={84} h={28} on={false} onPress={() => onFlag('liquor')} />}
      {step === 3 && <Hot id="nurse-show" x={70} y={58} w={100} h={90} on={false} onPress={() => onFlag('shown')} />}
      {step === 4 && <Hot id="nurse-look" x={48} y={40} w={144} h={110} on={false} onPress={() => onFlag('birthmark')} />}
    </Shot>
  )
}

/* ---------------------------------------------------------------- clamp */

/** The cord from the umbilicus. One tap places the clamp on the baby's side. */
export function ClampPicture({ run, onPick }: { run: NurseRun; onPick: (cm: number) => void }) {
  const svg = useRef<SVGSVGElement>(null)
  const p = CLAMP_PICTURE
  const xAt = (cm: number) => p.umbilicusX + cm * p.pxPerCm
  const placed = run.clampCm
  const close = placed !== null && placed < MIN_CLAMP_CM
  const secondCm = placed === null ? null : Math.min(placed + 1.6, (p.w - 18 - p.umbilicusX) / p.pxPerCm)
  const cut = placed !== null && !close && secondCm !== null && secondCm - placed >= 1.2
  const from = cut && placed !== null ? Math.round(xAt(placed) + 6) : null
  const to = cut && secondCm !== null ? Math.round(xAt(secondCm) - 6) : null
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
      <Vol scene={{ kind: 'clamp', from, to }} w={p.w} h={p.h} />
      {[1, 2, 3, 4, 5].map((cm) => (
        <rect key={cm} x={xAt(cm)} y={p.cordY + 14} width={2} height={6} fill={INK} style={{ pointerEvents: 'none' }} />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={xAt(MIN_CLAMP_CM)} y={p.cordY - 22 + i * 4} width={2} height={2} fill={MARK} style={{ pointerEvents: 'none' }} />
      ))}
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
      <Vol scene={{ kind: 'drug', palpated: run.palpated, early }} w={240} h={200} />
      {run.edta && <rect x={96} y={156} width={22} height={12} fill="#fff" stroke={INK} strokeWidth={1} style={{ pointerEvents: 'none' }} />}
      {run.clotted && <rect x={180} y={156} width={22} height={12} fill="#fff" stroke={INK} strokeWidth={1} style={{ pointerEvents: 'none' }} />}
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
      <Vol scene={{ kind: 'mother', gush: run.gush, longer: run.lengthen, firm: run.fundus }} w={240} h={268} />
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
      <Vol scene={{ kind: 'handover' }} w={240} h={220} />
      <Hot id="nurse-stable" x={8} y={8} w={150} h={64} on={run.stable} onPress={() => onFlag('stable')} />
      <Hot id="nurse-ward" x={164} y={12} w={68} h={72} on={run.ward} onPress={() => onFlag('ward')} />
      <Hot id="nurse-specimens" x={8} y={112} w={108} h={48} on={run.specimens} onPress={() => onFlag('specimens')} />
      <Hot id="nurse-papers" x={124} y={112} w={108} h={48} on={run.papers} onPress={() => onFlag('papers')} />
      <Hot id="nurse-escort" x={8} y={168} w={224} h={44} on={run.escort} onPress={() => onFlag('escort')} />
    </Shot>
  )
}
