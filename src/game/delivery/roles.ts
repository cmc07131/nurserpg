import type { Pack } from '~/engine/schema'

/** Who you are in the room. Doctor and midwife conduct the birth. The AED nurse does her own job. */
export type RoleId = 'doctor' | 'midwife' | 'nurse'

export type RoleBrief = {
  id: RoleId
  /** Short name on the bezel and the title menu. */
  short: string
  /** One line under the menu choice. */
  blurb: string
  /** Who the prep lines are said to. The step still targets the same person in the room. */
  partner: string
  stem: string
  prepHint: string
  prep: [string, string, string, string]
}

export const ROLES: Record<RoleId, RoleBrief> = {
  doctor: {
    id: 'doctor',
    short: 'Doctor',
    blurb: 'You conduct the birth',
    partner: 'Nurse Chiu',
    stem: 'Birth room. Mrs Lai, 28, is at 39 weeks in her second pregnancy. The pregnancy has been normal. The head is crowning. There are no complications.\n\nYou are the doctor. Nurse Chiu, the midwife, is with you. Conduct the delivery and the third stage.',
    prepHint: 'Ask Nurse Chiu: neonatal nurse, the pack, warmth, oxytocin 10 IU.',
    prep: [
      'Nurse Chiu, stay with me. Neonatal nurse for the baby.',
      'PPE on; sterile delivery pack, two clamps and scissors',
      'Warm towels, a hat, and the resuscitaire on',
      'Draw up oxytocin 10 IU for the third stage',
    ],
  },
  midwife: {
    id: 'midwife',
    short: 'Midwife',
    blurb: 'You conduct the birth',
    partner: 'Nurse Wong',
    stem: 'Birth room. Mrs Lai, 28, is at 39 weeks in her second pregnancy. The pregnancy has been normal. The head is crowning. There are no complications.\n\nYou are the midwife. Nurse Wong, the AED nurse, is with you. Conduct the delivery and the third stage.',
    prepHint: 'Ask Nurse Wong: neonatal nurse, the pack, warmth, oxytocin 10 IU drawn up and labelled.',
    prep: [
      'Nurse Wong, call the neonatal nurse and stay with Mrs Lai',
      'Open the sterile pack; PPE, two clamps and scissors',
      'Warm towels, a hat, resuscitaire checked and on',
      'Draw up oxytocin 10 IU and label it for the third stage',
    ],
  },
  nurse: {
    id: 'nurse',
    short: 'AED nurse',
    blurb: 'You nurse the A&E birth',
    partner: 'Nurse Chiu',
    stem: 'A&E. Mrs Lai, 28, is at 39 weeks in her second pregnancy. The pregnancy has been normal. The head is crowning. There are no complications.\n\nYou are the AED nurse. Nurse Chiu, the midwife, conducts the birth. You do not conduct the birth, and you do not assess the cervix.',
    prepHint: 'Nursing management: call both nurses, set out the pack, warmth, oxytocin drawn up and labelled.',
    prep: [
      'Call Nurse Chiu and the neonatal nurse: one for Mrs Lai, one for the baby',
      'Set out the sterile pack and PPE for the midwife: two clamps and scissors',
      'Warm towels, a hat, and the resuscitaire checked and on',
      'Draw up oxytocin 10 IU, label it, and keep it ready',
    ],
  },
}

const ROLE_KEY = 'nurserpg:role'

export function parseRole(value: unknown): RoleId {
  return value === 'doctor' || value === 'midwife' || value === 'nurse' ? value : 'nurse'
}

export function writeRole(role: RoleId) {
  try {
    localStorage.setItem(ROLE_KEY, role)
  } catch {
    // Private mode: the address still carries the role.
  }
}

export function readRole(): RoleId {
  try {
    return parseRole(localStorage.getItem(ROLE_KEY))
  } catch {
    return 'nurse'
  }
}

/**
 * The pack from the loader is left untouched. Doctor and midwife drop the nurse step and keep today's prep wording.
 * The nurse keeps only her step, so the birth benches are not hers.
 */
export function applyRole(pack: Pack, role: RoleId): Pack {
  const brief = ROLES[role]
  const nurse = role === 'nurse'
  const actions = pack.actions
    .filter((action) => (nurse ? action.id === 'nurse' : action.id !== 'nurse'))
    .map((action) => {
      if (nurse || action.id !== 'prep' || !action.options) return action
      return {
        ...action,
        hint: brief.prepHint,
        options: action.options.map((opt, i) => ({ ...opt, label: brief.prep[i] ?? opt.label })),
      }
    })
  const ids = new Set(actions.map((action) => action.id))
  const markIds = new Set<string>()
  for (const action of actions) {
    for (const id of action.marksChecklistIds ?? []) markIds.add(id)
    for (const opt of action.options ?? []) for (const id of opt.marksChecklistIds ?? []) markIds.add(id)
  }
  return {
    ...pack,
    title: nurse ? 'AED nurse · Imminent birth' : `${brief.short} · Normal delivery`,
    meta: { ...pack.meta, stem: brief.stem },
    cast: pack.cast.map((person) => (person.id === 'midwife' ? { ...person, displayName: brief.partner } : { ...person })),
    actions,
    phases: (pack.phases ?? [])
      .filter((phase) => (nurse ? phase.steps.every((id) => id === 'nurse') : phase.steps.every((id) => id !== 'nurse')))
      .map((phase) => ({ ...phase, steps: [...phase.steps] })),
    goldPath: pack.goldPath.filter((id) => ids.has(id)),
    marks: pack.marks.filter((mark) => markIds.has(mark.id)),
  }
}
