import type { Pack } from '~/engine/schema'

/** Who you are in the room. The birth and the third stage are the same steps for every role. */
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
    blurb: 'Nursing management of the room',
    partner: 'Nurse Chiu',
    stem: 'Birth room. Mrs Lai, 28, is at 39 weeks in her second pregnancy. The pregnancy has been normal. The head is crowning. There are no complications.\n\nYou are the AED nurse. You run the room for Nurse Chiu, the midwife: call the right people, set out the pack, keep the baby warm, and have the oxytocin ready. Then walk the delivery and the third stage, so the order is yours.',
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
  return value === 'doctor' || value === 'midwife' || value === 'nurse' ? value : 'midwife'
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
    return 'midwife'
  }
}

/**
 * Same marks and the same benches. The role changes who you are, who you speak to, and how the preparation is worded.
 * The pack from the loader is left untouched.
 */
export function applyRole(pack: Pack, role: RoleId): Pack {
  const brief = ROLES[role]
  return {
    ...pack,
    title: `${brief.short} · Normal delivery`,
    meta: { ...pack.meta, stem: brief.stem },
    cast: pack.cast.map((person) => (person.id === 'midwife' ? { ...person, displayName: brief.partner } : person)),
    actions: pack.actions.map((action) => {
      if (action.id !== 'prep' || !action.options) return action
      return {
        ...action,
        hint: brief.prepHint,
        options: action.options.map((opt, i) => ({ ...opt, label: brief.prep[i] ?? opt.label })),
      }
    }),
  }
}
