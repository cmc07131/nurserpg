/**
 * The A&E nurse's job at an imminent normal birth. Nurse Chiu conducts the birth.
 * Facts from the department note on the A&E nurse's role. Practice, not a prescription.
 */

export type Row = { key: string; label: string; value: string; range: string; ok: boolean; why: string; critical?: boolean }

export type NurseRun = {
  crowning: boolean
  perineum: boolean
  anus: boolean
  push: boolean
  liquorAsk: boolean
  allergy: boolean
  obstetric: boolean
  weeks: boolean
  ppe: boolean
  set: boolean
  pad: boolean
  drugOut: boolean
  bottles: boolean
  form: boolean
  explain: boolean
  consent: boolean
  time: boolean
  cord: boolean
  liquor: boolean
  shown: boolean
  birthmark: boolean
  /** Centimetres from the umbilicus. Null until the first tap. A short clamp stays until the step is redone. */
  clampCm: number | null
  palpated: boolean
  syntometrine: boolean
  /** Set if syntometrine went in before the abdomen was palpated. Stays until the step is redone. */
  drugEarly: boolean
  drugTime: boolean
  edta: boolean
  clotted: boolean
  gush: boolean
  lengthen: boolean
  fundus: boolean
  vessels: boolean
  bag: boolean
  padOn: boolean
  warm: boolean
  loss: boolean
  pulse: boolean
  stable: boolean
  ward: boolean
  specimens: boolean
  papers: boolean
  escort: boolean
}

export type Flag =
  | 'crowning'
  | 'perineum'
  | 'anus'
  | 'push'
  | 'liquorAsk'
  | 'allergy'
  | 'obstetric'
  | 'weeks'
  | 'ppe'
  | 'set'
  | 'pad'
  | 'drugOut'
  | 'bottles'
  | 'form'
  | 'explain'
  | 'consent'
  | 'time'
  | 'cord'
  | 'liquor'
  | 'shown'
  | 'birthmark'
  | 'palpated'
  | 'drugTime'
  | 'edta'
  | 'clotted'
  | 'gush'
  | 'lengthen'
  | 'fundus'
  | 'vessels'
  | 'bag'
  | 'padOn'
  | 'warm'
  | 'loss'
  | 'pulse'
  | 'stable'
  | 'ward'
  | 'specimens'
  | 'papers'
  | 'escort'

export function freshNurse(): NurseRun {
  return {
    crowning: false,
    perineum: false,
    anus: false,
    push: false,
    liquorAsk: false,
    allergy: false,
    obstetric: false,
    weeks: false,
    ppe: false,
    set: false,
    pad: false,
    drugOut: false,
    bottles: false,
    form: false,
    explain: false,
    consent: false,
    time: false,
    cord: false,
    liquor: false,
    shown: false,
    birthmark: false,
    clampCm: null,
    palpated: false,
    syntometrine: false,
    drugEarly: false,
    drugTime: false,
    edta: false,
    clotted: false,
    gush: false,
    lengthen: false,
    fundus: false,
    vessels: false,
    bag: false,
    padOn: false,
    warm: false,
    loss: false,
    pulse: false,
    stable: false,
    ward: false,
    specimens: false,
    papers: false,
    escort: false,
  }
}

export function setFlag(r: NurseRun, key: Flag): Partial<NurseRun> | null {
  if (r[key]) return null
  return { [key]: true } as Partial<NurseRun>
}

/** The cord picture. 20 user units are 1 cm. The 2.5 cm line is where a clamp may start. */
export const CLAMP_PICTURE = { w: 240, h: 120, umbilicusX: 48, cordY: 62, pxPerCm: 20, hit: 22 }

export const MIN_CLAMP_CM = 2.5

/** Tenths, rounded down, so a tap short of 2.5 cm cannot display as 2.5. Off the cord: null. */
export function cmAt(x: number, y: number): number | null {
  const p = CLAMP_PICTURE
  if (Math.abs(y - p.cordY) > p.hit || x < p.umbilicusX || x > p.w - 6) return null
  const raw = (x - p.umbilicusX) / p.pxPerCm
  return Math.floor(raw * 10 + 1e-6) / 10
}

/** The first tap stays, including one closer than 2.5 cm, until this step is redone. */
export function chooseClamp(r: NurseRun, cm: number): Partial<NurseRun> | null {
  if (r.clampCm !== null) return null
  return { clampCm: cm }
}

/** Giving it before palpation stays a failed dose until this step is redone. */
export function giveSyntometrine(r: NurseRun): Partial<NurseRun> | null {
  if (r.syntometrine) return null
  return { syntometrine: true, drugEarly: !r.palpated }
}

export const separationCount = (r: NurseRun) => [r.gush, r.lengthen, r.fundus].filter(Boolean).length

const clampOk = (r: NurseRun) => r.clampCm !== null && r.clampCm >= MIN_CLAMP_CM

type GoalSpec = {
  label: string
  how: (r: NurseRun) => string
  ok: (r: NurseRun) => boolean
  failed?: (r: NurseRun) => boolean
  now?: (r: NurseRun) => string | undefined
}

export type Duty = {
  key: 'look' | 'ask' | 'prepare' | 'birth' | 'drug' | 'mother' | 'handover'
  title: string
  label: string
  range: string
  why: string
  lede: string
  goals: GoalSpec[]
  value: (r: NurseRun) => string
}

const said = (parts: [boolean, string][]) => {
  const on = parts.filter(([ok]) => ok).map(([, text]) => text)
  return on.length ? on.join('; ') : 'Not done'
}

export const DUTIES: readonly Duty[] = [
  {
    key: 'look',
    title: 'Look',
    label: 'Imminent signs',
    range: 'Crowning, vulval gapping with a bulging perineum, anus pouting, and an involuntary urge to push',
    why: 'Those are the signs you can see or hear. Full dilatation is not your examination, and you do not conduct the birth.',
    lede: 'Tap what you see, and what she says.',
    goals: [
      {
        label: 'Crowning',
        ok: (r) => r.crowning,
        how: () => 'Tap CROWNING. The head stays at the vulva and does not slip back. That is a sign you can see.',
      },
      {
        label: 'Vulva gaping, perineum bulging',
        ok: (r) => r.perineum,
        how: () => 'Tap VULVA GAPING, PERINEUM BULGING. The vulva opens and the perineum bulges as the head comes down.',
      },
      {
        label: 'Anus pouting',
        ok: (r) => r.anus,
        how: () => 'Tap ANUS POUTING. A pouting anus, with the other signs, means the birth is imminent.',
      },
      {
        label: 'She says she has to push',
        ok: (r) => r.push,
        how: () => 'Tap what she says: “I HAVE TO PUSH.” An involuntary urge to push is a sign you hear, not a cervix you examine.',
      },
    ],
    value: (r) => said([
      [r.crowning, 'crowning'],
      [r.perineum, 'vulva gaping, perineum bulging'],
      [r.anus, 'anus pouting'],
      [r.push, 'she has to push'],
    ]),
  },
  {
    key: 'ask',
    title: 'Ask',
    label: 'Rapid history',
    range: 'Waters clear, no allergies or medicines, one baby, no previous caesarean or bleed, 39 weeks',
    why: 'The short history is normal, so you prepare for a normal birth in A&E.',
    lede: 'Ask her. She answers.',
    goals: [
      {
        label: 'The waters',
        ok: (r) => r.liquorAsk,
        how: () => 'Ask about the waters. She says they are clear.',
      },
      {
        label: 'Allergies and medicines',
        ok: (r) => r.allergy,
        how: () => 'Ask about allergies and medicines. She has none.',
      },
      {
        label: 'This pregnancy',
        ok: (r) => r.obstetric,
        how: () => 'Ask about this pregnancy: how many babies, any previous caesarean, any bleed. One baby, no caesarean, no bleed.',
      },
      {
        label: 'How many weeks',
        ok: (r) => r.weeks,
        how: () => 'Ask how many weeks. She is 39 weeks, in her second pregnancy.',
      },
    ],
    value: (r) => said([
      [r.liquorAsk, 'waters clear'],
      [r.allergy, 'no allergies or medicines'],
      [r.obstetric, 'one baby, no caesarean, no bleed'],
      [r.weeks, '39 weeks'],
    ]),
  },
  {
    key: 'prepare',
    title: 'Prepare',
    label: 'Room, trolley, mother',
    range: 'PPE, sterile delivery set, chlorhexidine and a maternity pad, syntometrine 1 ml on the trolley (not given), both bottles, the BBA/BOA form, an explanation, and verbal consent. No ATT injection',
    why: 'Nurse Chiu can deliver only if the trolley and Mrs Lai are ready. Syntometrine waits until a second twin is excluded.',
    lede: 'Dress, stock the trolley, and talk to her.',
    goals: [
      {
        label: 'PPE on',
        ok: (r) => r.ppe,
        how: () => 'Put on a gown, eye protection, and sterile gloves. You are beside the birth.',
      },
      {
        label: 'Sterile delivery set',
        ok: (r) => r.set,
        how: () => 'Open the sterile delivery set: two straight artery forceps, cord scissors, and two cord clamps.',
      },
      {
        label: 'Chlorhexidine and a maternity pad',
        ok: (r) => r.pad,
        how: () => 'Put chlorhexidine and a maternity pad on the trolley.',
      },
      {
        label: 'Syntometrine 1 ml on the trolley, not given',
        ok: (r) => r.drugOut,
        how: () => 'Put a syntometrine 1 ml ampoule on the trolley. Do not give it yet. There is no ATT injection.',
      },
      {
        label: 'EDTA for G6PD and a clotted bottle for TSH',
        ok: (r) => r.bottles,
        how: () => 'Set out an EDTA bottle for G6PD and a clotted bottle for TSH. You label them after the birth.',
      },
      {
        label: 'BBA/BOA form',
        ok: (r) => r.form,
        how: () => 'Get the BBA/BOA form out. A birth in A&E is written on it.',
      },
      {
        label: 'Told her the birth is here, and stayed',
        ok: (r) => r.explain,
        how: () => 'Tell her the birth will happen here in A&E, and stay with her.',
      },
      {
        label: 'Verbal consent if an episiotomy is needed',
        ok: (r) => r.consent,
        how: () => 'Ask verbal consent for an episiotomy if Nurse Chiu needs one. You do not decide to cut.',
      },
    ],
    value: (r) => said([
      [r.ppe, 'PPE'],
      [r.set, 'delivery set'],
      [r.pad, 'chlorhexidine and a pad'],
      [r.drugOut, 'syntometrine 1 ml on the trolley'],
      [r.bottles, 'both bottles'],
      [r.form, 'BBA/BOA'],
      [r.explain, 'explained, stayed'],
      [r.consent, 'episiotomy consent'],
    ]),
  },
  {
    key: 'birth',
    title: 'Birth',
    label: 'At the birth',
    range: 'Time called, no cord around the neck, clear liquor, baby shown and the sex stated, no birthmark, clamp at least 2.5 cm from the umbilicus',
    why: 'You record what you see. The clamp leaves a stump. Nurse Chiu conducts the birth.',
    lede: 'Nurse Chiu delivers. You watch, show the baby, and clamp the cord.',
    goals: [
      {
        label: 'Time of birth called',
        ok: (r) => r.time,
        how: () => 'Call the time of birth so it can be written down.',
      },
      {
        label: 'No cord around the neck',
        ok: (r) => r.cord,
        how: () => 'Look and say so: there is no cord around the neck.',
      },
      {
        label: 'Liquor clear',
        ok: (r) => r.liquor,
        how: () => 'Note the liquor. It is clear.',
      },
      {
        label: 'Baby shown, sex stated',
        ok: (r) => r.shown,
        how: () => 'Show her the baby and let her state the sex. She says a girl.',
      },
      {
        label: 'No birthmark',
        ok: (r) => r.birthmark,
        how: () => 'Look the baby over with her and report it: no birthmark.',
      },
      {
        label: 'Clamp at least 2.5 cm from the umbilicus',
        ok: clampOk,
        failed: (r) => r.clampCm !== null && r.clampCm < MIN_CLAMP_CM,
        now: (r) => (r.clampCm === null ? undefined : `${r.clampCm.toFixed(1)} cm`),
        how: (r) =>
          r.clampCm !== null && r.clampCm < MIN_CLAMP_CM
            ? `That clamp is ${r.clampCm.toFixed(1)} cm from the umbilicus, closer than 2.5 cm. REDO THIS STEP and tap further along the cord.`
            : 'Tap the cord on the 2.5 cm line or further from the umbilicus, away from the baby.',
      },
    ],
    value: (r) =>
      [
        said([
          [r.time, 'time called'],
          [r.cord, 'no cord around the neck'],
          [r.liquor, 'clear liquor'],
          [r.shown, 'shown: a girl'],
          [r.birthmark, 'no birthmark'],
        ]),
        r.clampCm === null ? 'cord not clamped' : `clamp ${r.clampCm.toFixed(1)} cm${r.clampCm < MIN_CLAMP_CM ? ', closer than 2.5 cm' : ''}`,
      ].join('; '),
  },
  {
    key: 'drug',
    title: 'Drug',
    label: 'Twin, then syntometrine',
    range: 'Palpate and exclude a second twin, then syntometrine 1 ml IM, record the time, and label both bottles',
    why: 'Syntometrine before you have felt for a second twin can trap that baby. Both bottles need her name.',
    lede: 'Feel the abdomen, then give the injection.',
    goals: [
      {
        label: 'Palpated: no second twin',
        ok: (r) => r.palpated,
        how: () => 'Palpate the abdomen before any syntometrine. One baby, the size of a single pregnancy. No second twin.',
      },
      {
        label: 'Syntometrine 1 ml IM after that',
        ok: (r) => r.syntometrine && r.palpated && !r.drugEarly,
        failed: (r) => r.drugEarly,
        how: (r) =>
          r.drugEarly
            ? 'You gave syntometrine before feeling for a second twin. It can trap a baby still inside. REDO THIS STEP. Palpate first, then give syntometrine 1 ml IM.'
            : 'After the palpation, give syntometrine 1 ml intramuscular. Not before.',
      },
      {
        label: 'Injection time recorded',
        ok: (r) => r.drugTime,
        how: () => 'Record the time you gave the syntometrine.',
      },
      {
        label: 'EDTA bottle labelled',
        ok: (r) => r.edta,
        how: () => 'Label the EDTA bottle with Mrs Lai’s details. It is for G6PD.',
      },
      {
        label: 'Clotted bottle labelled',
        ok: (r) => r.clotted,
        how: () => 'Label the clotted bottle with Mrs Lai’s details. It is for TSH.',
      },
    ],
    value: (r) =>
      [
        r.palpated ? 'palpated: no second twin' : 'not palpated',
        !r.syntometrine ? 'syntometrine not given' : r.drugEarly ? 'syntometrine 1 ml IM before palpation' : 'syntometrine 1 ml IM after palpation',
        r.drugTime ? 'injection time recorded' : 'injection time not recorded',
        `EDTA ${r.edta ? 'labelled' : 'unlabelled'}`,
        `clotted ${r.clotted ? 'labelled' : 'unlabelled'}`,
      ].join('; '),
  },
  {
    key: 'mother',
    title: 'Mother',
    label: 'Placenta and mother',
    range: 'At least two separation signs, two arteries and one vein, placenta in a labelled bag, maternity pad, warm and dry, blood loss estimated, pulse rechecked',
    why: 'You do not pull on the cord. Primary postpartum haemorrhage is more than 500 ml. This birth is not a haemorrhage.',
    lede: 'Watch the placenta. Do not pull the cord.',
    goals: [
      {
        label: 'At least two separation signs',
        ok: (r) => separationCount(r) >= 2,
        now: (r) => `${separationCount(r)} seen`,
        how: () => 'Tap at least two: a gush of blood, the cord lengthening, and the fundus firm, globular and risen. You do not pull on the cord.',
      },
      {
        label: 'Two arteries and one vein',
        ok: (r) => r.vessels,
        how: () => 'Look at the cut end of the cord: two arteries and one vein.',
      },
      {
        label: 'Placenta sealed in a labelled bag',
        ok: (r) => r.bag,
        how: () => 'Seal the placenta in a bag labelled with Mrs Lai’s details. It goes with her. You do not pull it out.',
      },
      {
        label: 'Maternity pad on',
        ok: (r) => r.padOn,
        how: () => 'Put a maternity pad on.',
      },
      {
        label: 'Warm and dry',
        ok: (r) => r.warm,
        how: () => 'Keep her warm and dry.',
      },
      {
        label: 'Blood loss estimated',
        ok: (r) => r.loss,
        how: () => 'Estimate the blood loss. This birth is not a haemorrhage. Primary postpartum haemorrhage is more than 500 ml.',
      },
      {
        label: 'Pulse rechecked',
        ok: (r) => r.pulse,
        how: () => 'Recheck her pulse. A rising pulse is an early sign of bleeding.',
      },
    ],
    value: (r) =>
      [
        `${separationCount(r)} separation sign${separationCount(r) === 1 ? '' : 's'}`,
        said([
          [r.vessels, 'two arteries, one vein'],
          [r.bag, 'placenta bagged and labelled'],
          [r.padOn, 'maternity pad'],
          [r.warm, 'warm and dry'],
          [r.loss, 'loss estimated, not a haemorrhage'],
          [r.pulse, 'pulse rechecked'],
        ]),
      ].join('; '),
  },
  {
    key: 'handover',
    title: 'Handover',
    label: 'Handover',
    range: 'Both stable, labour ward called, labelled bottles and sealed placenta, A&E charts and BBA/BOA, escort with the transfer bag and a phone',
    why: 'The ward needs the mother, the baby, the specimens, and the papers, with a nurse who can call on the way.',
    lede: 'Send them out with what the ward needs.',
    goals: [
      {
        label: 'Mother and baby stable',
        ok: (r) => r.stable,
        how: () => 'Confirm both are stable before you move them.',
      },
      {
        label: 'Labour ward called',
        ok: (r) => r.ward,
        how: () => 'Call the labour ward so they are ready.',
      },
      {
        label: 'Bottles and placenta go with her',
        ok: (r) => r.specimens,
        how: () => 'The labelled bottles and the sealed placenta go with her.',
      },
      {
        label: 'A&E charts and BBA/BOA',
        ok: (r) => r.papers,
        how: () => 'Send the A&E charts and the BBA/BOA form.',
      },
      {
        label: 'Escort with the transfer bag and a phone',
        ok: (r) => r.escort,
        how: () => 'An escort goes with them, carrying the transfer bag and a phone.',
      },
    ],
    value: (r) => said([
      [r.stable, 'both stable'],
      [r.ward, 'labour ward called'],
      [r.specimens, 'specimens with her'],
      [r.papers, 'charts and BBA/BOA'],
      [r.escort, 'escort, bag, phone'],
    ]),
  },
]

/** Row keys, in duty order. benchMarks pairs row i with grantMarks[i], which are these lines on the station. */
export const NURSE_MARKS = DUTIES.map((d) => d.key)

export const NURSE_LINES = [
  'Recognises imminent birth from what she can see and what the mother says',
  'Takes the rapid history',
  'Prepares the room, the trolley, and the mother',
  'Notes the time, the cord, the liquor, shows the baby, and clamps at least 2.5 cm from the umbilicus',
  'Excludes a second twin, then gives syntometrine 1 ml IM, and labels both cord-blood bottles',
  'Calls separation, checks two arteries and one vein, bags the placenta, and checks the mother',
  'Hands over a stable mother and baby with specimens, papers, and an escort',
] as const

export function checkNurse(r: NurseRun): Row[] {
  return DUTIES.map((d) => ({
    key: d.key,
    label: d.label,
    value: d.value(r),
    range: d.range,
    ok: d.goals.every((g) => g.ok(r)),
    why: d.why,
  }))
}
