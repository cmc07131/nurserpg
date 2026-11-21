#!/usr/bin/env node
/**
 * The A&E nurse bench (perform: nurse), done right the way a player does it. Every step must pass its goals
 * when Next is pressed. node scripts/verify/journeys/nurse.mjs
 */
import { finish, launch, openBench } from '../lib.mjs'

const LINES = [
  'Recognises imminent birth from what she can see and what the mother says',
  'Takes the rapid history',
  'Prepares the room, the trolley, and the mother',
  'Notes the time, the cord, the liquor, shows the baby, and clamps at least 2.5 cm from the umbilicus',
  'Excludes a second twin, then gives syntometrine 1 ml IM, and labels both cord-blood bottles',
  'Calls separation, checks two arteries and one vein, bags the placenta, and checks the mother',
  'Hands over a stable mother and baby with specimens, papers, and an escort',
]

const h = await launch()
let ok = true

/** Next, and the step must have passed its goals: a review opening is a failure of the journey. */
function stepper(ctx, prefix, stops) {
  return async () => {
    const at = await ctx.step()
    await ctx.page.getByTestId(`${prefix}-next`).click()
    await ctx.page.waitForTimeout(150)
    if (await ctx.page.locator('[data-review]').count()) {
      stops.push({ at, goals: (await ctx.page.getByTestId(`${prefix}-goals`).innerText()).replace(/\n+/g, ' | ') })
      await ctx.page.getByTestId(`${prefix}-review-anyway`).click()
      await ctx.page.waitForTimeout(150)
    }
  }
}

const ctx = await openBench(h.url, 'nurse', 'nurse')
const { page } = ctx
const stops = []
const next = stepper(ctx, 'nurse', stops)
let facts = {}
try {
  const click = async (id) => {
    await page.getByTestId(id).click()
  }
  await click('nurse-sign-crowning')
  await click('nurse-sign-perineum')
  await click('nurse-sign-anus')
  await click('nurse-sign-push')
  await ctx.shot('01-look')
  await next()
  await click('nurse-ask-liquor')
  await click('nurse-ask-allergy')
  await click('nurse-ask-obstetric')
  await click('nurse-ask-weeks')
  await ctx.shot('02-ask')
  await next()
  await click('nurse-ppe')
  await click('nurse-set')
  await click('nurse-pad')
  await click('nurse-drug-out')
  await click('nurse-bottles')
  await click('nurse-form')
  await click('nurse-explain')
  await click('nurse-consent')
  await ctx.shot('03-prepare')
  await next()
  await click('nurse-time')
  await ctx.shot('04a-time')
  await click('nurse-cord')
  await ctx.shot('04b-neck')
  await click('nurse-liquor')
  await ctx.shot('04c-liquor')
  await click('nurse-show')
  await ctx.shot('04d-show')
  await click('nurse-look')
  await ctx.shot('04e-skin')
  // CLAMP_PICTURE: umbilicus x=48, cord y=62, 20 px per cm. 128 is 4.0 cm, past 2.5.
  await ctx.tap('nurse-clamp-picture', 240, 120, 128, 62)
  await ctx.shot('04-birth')
  await next()
  await click('nurse-palpate')
  await click('nurse-syntometrine')
  await click('nurse-drug-time')
  await click('nurse-label-edta')
  await click('nurse-label-clotted')
  await ctx.shot('05-drug')
  await next()
  await click('nurse-sign-gush')
  await click('nurse-sign-length')
  await click('nurse-sign-fundus')
  await click('nurse-vessels')
  await click('nurse-bag')
  await click('nurse-pad-on')
  await click('nurse-warm')
  await click('nurse-loss')
  await click('nurse-pulse')
  await ctx.shot('06-mother')
  await next()
  await click('nurse-stable')
  await click('nurse-ward')
  await click('nurse-specimens')
  await click('nurse-papers')
  await click('nurse-escort')
  await ctx.shot('07-handover')
  await next()
  await page.getByTestId('nurse-check-done').click()
  await page.waitForTimeout(200)
  const result = await page.evaluate(() => window.__result)
  const marks = result?.marks ?? []
  const missing = LINES.filter((line) => !marks.includes(line))
  facts = { stops, marks, missing, faults: result?.faults ?? [] }
  ok = (await finish(ctx, stops.length === 0 && missing.length === 0, facts)) && ok
} catch (e) {
  await ctx.shot('error').catch(() => undefined)
  ok = (await finish(ctx, false, { ...facts, stops, error: String(e) })) && false
}
h.stop()
process.exit(ok ? 0 : 1)
