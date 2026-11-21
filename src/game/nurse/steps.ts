/**
 * What each duty of the A&E nurse must achieve, and the lesson shown when it is not done.
 */
import { goal, type Goal } from '../bench/goals'
import { DUTIES, type NurseRun } from './model'

export const NURSE_TITLES = DUTIES.map((d) => d.title)

export function nurseGoals(step: number, r: NurseRun): Goal[] {
  const duty = DUTIES[step]
  if (!duty) return []
  return duty.goals.map((g) => goal(g.label, g.ok(r), g.how(r), g.failed?.(r) ?? false, g.now?.(r)))
}
