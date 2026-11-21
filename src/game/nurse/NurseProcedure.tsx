import { useRef } from 'react'
import { useBench } from '../bench/core'
import { StepFrame, useStepper } from '../bench/goals'
import { CheckCard, benchMarks } from '../bench/kit'
import type { BenchResult, PerformJob } from '../store'
import { sfx } from '../sfx'
import { AskScene, BirthScene, ClampPicture, DrugScene, HandoverScene, LookPicture, MotherScene, PrepareScene } from './art'
import {
  DUTIES,
  MIN_CLAMP_CM,
  NURSE_MARKS,
  checkNurse,
  chooseClamp,
  freshNurse,
  giveSyntometrine,
  setFlag,
  type Flag,
  type NurseRun,
} from './model'
import { NURSE_TITLES, nurseGoals } from './steps'

/**
 * The A&E nurse at an imminent normal birth. Nurse Chiu delivers. You act on the pictures.
 */
export function NurseProcedure({ job, coach, onDone }: { job: PerformJob; coach: boolean; onDone: (r: BenchResult) => void }) {
  const api = useBench(freshNurse, coach)
  const body = useRef<HTMLDivElement>(null)
  const stepper = useStepper(api, NURSE_TITLES, nurseGoals, body)
  const done = useRef(false)
  const r = api.run
  function finish() {
    if (done.current) return
    done.current = true
    const run = api.runRef.current
    const { marks, faults } = benchMarks(checkNurse(run), NURSE_MARKS, job.grantMarks)
    onDone({
      marks,
      faults,
      summary: run.shown ? 'A girl. Mother and baby ready for the labour ward.' : 'The nurse’s job is not finished.',
      scene: [job.scene || 'handed-over'],
    })
  }
  const duty = DUTIES[stepper.index]
  function act(key: Flag, text: string) {
    const patch = setFlag(api.runRef.current, key)
    if (!patch) return
    api.upd(patch)
    sfx.select()
    api.feel(text)
  }
  return (
    <div className="io-bench flex min-h-0 flex-1 flex-col select-none" data-testid="nurse-bench">
      <div ref={body} className="min-h-0 flex-1 overflow-auto px-3 pb-3" style={{ scrollbarGutter: 'stable' }}>
        <StepFrame
          prefix="nurse"
          titles={NURSE_TITLES}
          stepper={stepper}
          goals={nurseGoals(stepper.index, r)}
          note={api.note}
          bar={
            <>
              <span>AED NURSE</span>
              <span />
              <span>{r.clampCm === null ? 'MRS LAI' : `CLAMP ${r.clampCm.toFixed(1)} CM`}</span>
            </>
          }
          check={<CheckCard rows={checkNurse(r)} onContinue={finish} testId="nurse-check" />}
        >
          {duty && <p className="io-lede">{duty.lede}</p>}
          {duty?.key === 'look' && (
            <LookPicture
              run={r}
              onSign={(sign) =>
                act(
                  sign,
                  sign === 'crowning' ? 'Crowning.' : sign === 'perineum' ? 'The perineum is bulging.' : sign === 'anus' ? 'The anus is pouting.' : 'She has to push.',
                )
              }
            />
          )}
          {duty?.key === 'ask' && <AskScene run={r} onAsk={(key) => act(key, key === 'liquorAsk' ? 'Waters are clear.' : key === 'allergy' ? 'No allergies.' : key === 'obstetric' ? 'One baby. No scar.' : '39 weeks.')} />}
          {duty?.key === 'prepare' && (
            <PrepareScene
              run={r}
              onFlag={(key) =>
                act(
                  key,
                  key === 'ppe' ? 'Gown, eyes, gloves.' : key === 'drugOut' ? 'Syntometrine is on the trolley. Not given.' : key === 'explain' ? 'You stay with her.' : key === 'consent' ? 'She agrees, if a cut is needed.' : 'On the trolley.',
                )
              }
            />
          )}
          {duty?.key === 'birth' && (
            <>
              <BirthScene
                run={r}
                onFlag={(key) => act(key, key === 'time' ? 'Time called.' : key === 'cord' ? 'No cord on the neck.' : key === 'liquor' ? 'Liquor is clear.' : key === 'shown' ? 'She says: a girl.' : 'No birthmark.')}
              />
              <ClampPicture
                run={r}
                onPick={(cm) => {
                  const patch = chooseClamp(api.runRef.current, cm)
                  const placed = patch?.clampCm
                  if (placed == null) return
                  api.upd({ clampCm: placed })
                  sfx.select()
                  api.feel(placed >= MIN_CLAMP_CM ? `Clamp at ${placed.toFixed(1)} cm.` : `${placed.toFixed(1)} cm is too close. Redo, and tap further out.`)
                }}
              />
            </>
          )}
          {duty?.key === 'drug' && (
            <DrugScene
              run={r}
              onPalpate={() => act('palpated', 'One baby. No second twin.')}
              onInject={() => {
                const patch = giveSyntometrine(api.runRef.current)
                if (!patch) return
                api.upd(patch)
                sfx.select()
                api.feel(patch.drugEarly ? 'Too soon. Feel the abdomen first, then redo.' : 'Syntometrine 1 ml, into the muscle.')
              }}
              onFlag={(key) => act(key, key === 'drugTime' ? 'Time written.' : key === 'edta' ? 'EDTA labelled. G6PD.' : 'Clotted bottle labelled. TSH.')}
            />
          )}
          {duty?.key === 'mother' && (
            <MotherScene
              run={r}
              onFlag={(key) =>
                act(
                  key,
                  key === 'lengthen' ? 'The cord lengthens. You do not pull.' : key === 'gush' ? 'A gush.' : key === 'fundus' ? 'The fundus rises, firm.' : key === 'vessels' ? 'Two arteries, one vein.' : key === 'bag' ? 'Placenta in the bag.' : key === 'loss' ? 'Not a haemorrhage.' : key === 'pulse' ? 'Pulse checked.' : 'Done.',
                )
              }
            />
          )}
          {duty?.key === 'handover' && (
            <HandoverScene
              run={r}
              onFlag={(key) => act(key, key === 'ward' ? 'Labour ward knows.' : key === 'escort' ? 'You walk with them.' : key === 'specimens' ? 'Bottles and placenta on the tray.' : key === 'papers' ? 'Notes packed.' : 'Both stable.')}
            />
          )}
        </StepFrame>
      </div>
    </div>
  )
}
