import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ASK_VIEW,
  BIRTH_VIEW,
  CLAMP_VIEW,
  DRUG_VIEW,
  HANDOVER_VIEW,
  LOOK_VIEW,
  MAT,
  MOTHER_VIEW,
  PREPARE_VIEW,
  buildAsk,
  buildBirth,
  buildClamp,
  buildDrug,
  buildHandover,
  buildLook,
  buildMother,
  buildPrepare,
  centroid,
  frameFor,
  grid,
  horizontalSlice,
  picture,
  project,
  put,
  render,
  type Frame,
} from './volume'

function matAt(frame: Frame, x: number, y: number) {
  return frame.mat[y * frame.w + x] ?? 0
}

function mass(frame: Frame, x: number, y: number, w: number, h: number, materials: number[]) {
  const want = new Set(materials)
  let n = 0
  let sx = 0
  let sy = 0
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (!want.has(matAt(frame, xx, yy))) continue
      n++
      sx += xx
      sy += yy
    }
  }
  assert.ok(n >= 16, `expected landmark pixels in ${x},${y} ${w}x${h}, saw ${n}`)
  return { x: sx / n, y: sy / n, n }
}

test('a horizontal slice holds only that y', () => {
  const g = grid(4, 3, 2)
  put(g, 1, 0, 0, MAT.skin)
  put(g, 2, 1, 1, MAT.cord)
  const low = horizontalSlice(g, 0)
  const mid = horizontalSlice(g, 1)
  assert.equal(low[1], MAT.skin)
  assert.equal(mid[2 + 4 * 1], MAT.cord)
  assert.equal(low[2 + 4 * 1], 0)
  assert.equal([...horizontalSlice(g, 2)].every((v) => v === 0), true)
})

test('the fixed view paints the slice that contains the voxel', () => {
  const g = grid(8, 8, 4)
  put(g, 3, 4, 1, MAT.cord)
  const view = { w: 16, h: 16, pix: 2, ox: 0, oy: 16 }
  const frame = render(g, view)
  const p = project(view, 3, 4)
  assert.equal(matAt(frame, p.x | 0, p.y | 0), MAT.cord)
  assert.equal(horizontalSlice(g, 4)[3 + 8 * 1], MAT.cord)
  assert.equal(horizontalSlice(g, 3)[3 + 8 * 1], 0)
})

test('look signs sit on the head, the perineum, and the anus', () => {
  const frame = render(buildLook(), LOOK_VIEW)
  const head = centroid(frame, [MAT.occiput, MAT.scalp])
  const perineum = centroid(frame, [MAT.perineum])
  const anus = centroid(frame, [MAT.anus])
  assert.ok(head && Math.hypot(head.x - 120, head.y - 78) <= 10, JSON.stringify(head))
  assert.ok(perineum && Math.hypot(perineum.x - 120, perineum.y - 124) <= 10, JSON.stringify(perineum))
  assert.ok(anus && Math.hypot(anus.x - 120, anus.y - 156) <= 8, JSON.stringify(anus))
  assert.equal(frame.w, 240)
  assert.equal(frame.h, 206)
})

test('the clamp picture keeps the umbilicus and the 4 cm tap', () => {
  const frame = render(buildClamp(null), CLAMP_VIEW)
  assert.equal(frame.w, 240)
  assert.equal(frame.h, 120)
  assert.equal(matAt(frame, 48, 62), MAT.umbilicus)
  assert.equal(matAt(frame, 128, 62), MAT.cord)
  const cut = render(buildClamp({ from: 134, to: 154 }), CLAMP_VIEW)
  assert.equal(matAt(cut, 128, 62), MAT.cord)
  assert.equal(matAt(cut, 144, 62), MAT.blood)
  assert.notEqual(matAt(cut, 144, 62), MAT.cord)
})

test('ask, prepare, birth, drug, mother, and handover landmarks sit in their targets', () => {
  const ask = render(buildAsk(), ASK_VIEW)
  const face = mass(ask, 14, 34, 58, 62, [MAT.skin, MAT.hair, MAT.ink, MAT.glass, MAT.mucosa])
  assert.ok(face.x > 20 && face.x < 70 && face.y > 40 && face.y < 90)
  assert.equal(matAt(ask, 120, 126), MAT.fluid)
  const arm = mass(ask, 164, 36, 66, 70, [MAT.skin, MAT.glove])
  assert.ok(arm.x >= 164 && arm.x < 230)

  const prep = render(buildPrepare(false, false), PREPARE_VIEW)
  mass(prep, 6, 8, 72, 108, [MAT.skin, MAT.cloth, MAT.hair, MAT.ink])
  mass(prep, 88, 22, 70, 54, [MAT.cloth])
  mass(prep, 164, 22, 66, 54, [MAT.ampoule])
  mass(prep, 88, 80, 70, 52, [MAT.fluid, MAT.paper])
  mass(prep, 164, 80, 66, 52, [MAT.glass, MAT.cap, MAT.blood])
  mass(prep, 6, 122, 72, 52, [MAT.paper])
  mass(prep, 84, 142, 148, 48, [MAT.skin, MAT.gown, MAT.glove, MAT.hair])
  mass(prep, 8, 198, 224, 44, [MAT.metal, MAT.skin, MAT.hair])
  const open = render(buildPrepare(true, true), PREPARE_VIEW)
  mass(open, 6, 8, 72, 108, [MAT.gown, MAT.glove])
  mass(open, 88, 22, 70, 54, [MAT.metal])

  const cord = render(buildBirth(1), BIRTH_VIEW)
  assert.equal(matAt(cord, 120, 114), MAT.cord)
  const liquor = render(buildBirth(2), BIRTH_VIEW)
  assert.equal(matAt(liquor, 120, 134), MAT.fluid)
  mass(render(buildBirth(0), BIRTH_VIEW), 8, 48, 56, 64, [MAT.clock, MAT.ink])
  mass(render(buildBirth(3), BIRTH_VIEW), 70, 58, 100, 90, [MAT.baby, MAT.ink, MAT.hair])
  mass(render(buildBirth(4), BIRTH_VIEW), 48, 40, 144, 110, [MAT.baby, MAT.hair])

  const drug = render(buildDrug(true, false), DRUG_VIEW)
  mass(drug, 90, 32, 130, 84, [MAT.mucosa, MAT.glove, MAT.baby])
  mass(drug, 8, 40, 70, 96, [MAT.skin, MAT.glass])
  mass(drug, 8, 148, 52, 46, [MAT.clock, MAT.ink])
  mass(drug, 66, 148, 80, 46, [MAT.glass, MAT.cap])
  mass(drug, 152, 148, 80, 46, [MAT.glass, MAT.blood])

  const mother = render(buildMother(true, true, true), MOTHER_VIEW)
  mass(mother, 156, 18, 76, 56, [MAT.mucosa])
  mass(mother, 96, 78, 44, 34, [MAT.blood])
  mass(mother, 98, 116, 40, 36, [MAT.cord])
  mass(mother, 162, 96, 70, 56, [MAT.blood, MAT.mucosa])
  mass(mother, 8, 168, 70, 46, [MAT.drape, MAT.blood])
  mass(mother, 84, 168, 72, 46, [MAT.paper])
  mass(mother, 162, 168, 70, 46, [MAT.cloth])
  mass(mother, 8, 220, 70, 42, [MAT.glass, MAT.blood])
  mass(mother, 84, 220, 148, 42, [MAT.skin, MAT.glove])

  const hand = render(buildHandover(), HANDOVER_VIEW)
  mass(hand, 8, 8, 150, 64, [MAT.skin, MAT.baby, MAT.hat, MAT.hair])
  mass(hand, 164, 12, 68, 72, [MAT.phone])
  mass(hand, 8, 112, 108, 48, [MAT.wood, MAT.glass, MAT.cap, MAT.blood, MAT.drape])
  mass(hand, 124, 112, 108, 48, [MAT.paper])
  mass(hand, 8, 168, 224, 44, [MAT.skin, MAT.gown, MAT.phone, MAT.hair])
})

test('picture is one memoised png for a scene', () => {
  const scene = { kind: 'look' } as const
  const first = picture(scene)
  assert.equal(first.startsWith('data:image/png;base64,'), true)
  assert.equal(picture(scene), first)
  assert.equal(frameFor(scene), frameFor(scene))
})
