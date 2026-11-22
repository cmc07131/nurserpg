import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  CLAMP_PICTURE,
  DUTIES,
  NURSE_LINES,
  NURSE_MARKS,
  checkNurse,
  chooseClamp,
  cmAt,
  freshNurse,
  giveSyntometrine,
  setFlag,
  type Flag,
  type NurseRun,
} from './model'
import { ROLES } from '../delivery/roles'
import { NURSE_TITLES, nurseGoals } from './steps'

const ON_LINE = CLAMP_PICTURE.umbilicusX + 2.5 * CLAMP_PICTURE.pxPerCm

const FLAGS: Flag[] = [
  'crowning',
  'perineum',
  'anus',
  'push',
  'liquorAsk',
  'allergy',
  'obstetric',
  'weeks',
  'ppe',
  'set',
  'pad',
  'drugOut',
  'bottles',
  'form',
  'explain',
  'consent',
  'time',
  'cord',
  'liquor',
  'shown',
  'birthmark',
  'palpated',
  'drugTime',
  'edta',
  'clotted',
  'gush',
  'lengthen',
  'fundus',
  'vessels',
  'bag',
  'padOn',
  'warm',
  'loss',
  'pulse',
  'stable',
  'ward',
  'specimens',
  'papers',
  'escort',
]

/** A finished run built the way the buttons do: flags, then a clamp on the cord, then syntometrine after palpation. */
function finished(): NurseRun {
  let r = freshNurse()
  for (const key of FLAGS) {
    const patch = setFlag(r, key)
    assert.ok(patch)
    r = { ...r, ...patch }
  }
  const cm = cmAt(CLAMP_PICTURE.umbilicusX + 4 * CLAMP_PICTURE.pxPerCm, CLAMP_PICTURE.cordY)
  assert.equal(cm, 4)
  const clamp = chooseClamp(r, cm)
  assert.ok(clamp)
  r = { ...r, ...clamp }
  const drug = giveSyntometrine(r)
  assert.ok(drug)
  assert.equal(drug.drugEarly, false)
  return { ...r, ...drug }
}

test('a finished correct run passes every check row', () => {
  const r = finished()
  const rows = checkNurse(r)
  assert.deepEqual(
    rows.map((row) => row.ok),
    [true, true, true, true, true, true, true],
  )
  assert.deepEqual(
    rows.map((row) => row.key),
    [...NURSE_MARKS],
  )
  assert.deepEqual(NURSE_MARKS, ['look', 'ask', 'prepare', 'birth', 'drug', 'mother', 'handover'])
  assert.equal(NURSE_LINES.length, 7)
  assert.equal(DUTIES.length, 7)
  for (let i = 0; i < NURSE_TITLES.length; i++) {
    for (const g of nurseGoals(i, r)) assert.equal(g.state, 'done', `${NURSE_TITLES[i]}: ${g.label}`)
  }
})

test('syntometrine before palpation fails the drug row', () => {
  let r = finished()
  r = { ...r, palpated: false, syntometrine: false, drugEarly: false }
  const early = giveSyntometrine(r)
  assert.equal(early?.drugEarly, true)
  assert.equal(early?.syntometrine, true)
  r = { ...r, ...early, palpated: true }
  const row = checkNurse(r).find((item) => item.key === 'drug')
  assert.equal(row?.ok, false)
  const step = DUTIES.findIndex((d) => d.key === 'drug')
  const goal = nurseGoals(step, r).find((g) => g.label === 'Syntometrine 1 ml IM after that')
  assert.equal(goal?.state, 'fail')
})

test('a clamp under 2.5 cm fails the birth row', () => {
  assert.equal(cmAt(ON_LINE, CLAMP_PICTURE.cordY), 2.5)
  const closeCm = cmAt(CLAMP_PICTURE.umbilicusX + CLAMP_PICTURE.pxPerCm, CLAMP_PICTURE.cordY)
  assert.equal(closeCm, 1)
  let r = finished()
  r = { ...r, clampCm: null }
  const patch = chooseClamp(r, closeCm ?? -1)
  assert.ok(patch)
  r = { ...r, ...patch }
  const row = checkNurse(r).find((item) => item.key === 'birth')
  assert.equal(row?.ok, false)
  const step = DUTIES.findIndex((d) => d.key === 'birth')
  const goal = nurseGoals(step, r).find((g) => g.label.startsWith('Clamp'))
  assert.equal(goal?.state, 'fail')
  const edge = { ...finished(), clampCm: null }
  const onLine = chooseClamp(edge, cmAt(CLAMP_PICTURE.umbilicusX + 2.5 * CLAMP_PICTURE.pxPerCm, CLAMP_PICTURE.cordY) ?? -1)
  assert.equal(checkNurse({ ...edge, ...onLine }).find((item) => item.key === 'birth')?.ok, true)
})

test('the look opening does not name the sign', () => {
  const look = DUTIES.find((duty) => duty.key === 'look')
  assert.equal(
    look?.lede,
    'You are an AED nurse assessing a pregnant woman at triage. She says, ‘I have to push!’ Her perineum is exposed for assessment. Look closely at the picture. What sign suggests that birth is imminent?',
  )
  assert.equal(/crown/i.test(look?.lede ?? ''), false)
  assert.equal(/crown/i.test(ROLES.nurse.stem), false)
  assert.equal(/crowning/.test(ROLES.doctor.stem), true)
  assert.equal(/crowning/.test(ROLES.midwife.stem), true)
})

test('a run with one separation sign fails the mother row', () => {
  const one = { ...finished(), gush: true, lengthen: false, fundus: false }
  assert.equal(checkNurse(one).find((row) => row.key === 'mother')?.ok, false)
  const two = { ...finished(), gush: true, lengthen: true, fundus: false }
  assert.equal(checkNurse(two).find((row) => row.key === 'mother')?.ok, true)
})
