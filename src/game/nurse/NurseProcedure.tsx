import { useRef } from 'react'
import { useBench, type BenchApi } from '../bench/core'
import { StepFrame, useStepper } from '../bench/goals'
import { CheckCard, benchMarks } from '../bench/kit'
import type { BenchResult, PerformJob } from '../store'
import { sfx } from '../sfx'
import { ClampPicture, LookPicture } from './art'
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

type S = BenchApi<NurseRun>

/**
 * The A&E nurse at an imminent normal birth. Nurse Chiu delivers. This bench is her job, not the birth itself.
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
          {duty && (
            <>
              <p className="io-lede">{duty.lede}</p>
              {duty.key === 'look' && (
                <LookPicture
                  run={r}
                  onSign={(sign) => {
                    const line =
                      sign === 'crowning'
                        ? 'The head is crowning. It does not slip back.'
                        : sign === 'perineum'
                          ? 'The vulva is gaping and the perineum is bulging.'
                          : sign === 'anus'
                            ? 'The anus is pouting.'
                            : 'Mrs Lai: “I have to push.” It is involuntary.'
                    press(api, sign, line)()
                  }}
                />
              )}
              {duty.key === 'look' && <LookButtons {...api} />}
              {duty.key === 'ask' && <AskButtons {...api} />}
              {duty.key === 'prepare' && <PrepareButtons {...api} />}
              {duty.key === 'birth' && <BirthButtons {...api} />}
              {duty.key === 'drug' && <DrugButtons {...api} />}
              {duty.key === 'mother' && <MotherButtons {...api} />}
              {duty.key === 'handover' && <HandoverButtons {...api} />}
            </>
          )}
        </StepFrame>
      </div>
    </div>
  )
}

function press(api: S, key: Flag, text: string) {
  return () => {
    const patch = setFlag(api.runRef.current, key)
    if (!patch) return
    api.upd(patch)
    sfx.select()
    api.feel(text)
  }
}

function Btn({ id, on, label, detail, onPress }: { id: string; on: boolean; label: string; detail?: string; onPress: () => void }) {
  return (
    <div className="mt-2">
      <button type="button" className="tap" data-testid={id} data-on={on || undefined} onClick={onPress}>
        {on ? '✓ ' : ''}
        {label}
      </button>
      {on && detail ? <p className="io-small">{detail}</p> : null}
    </div>
  )
}

function LookButtons(api: S) {
  const r = api.run
  return (
    <>
      <Btn id="nurse-sign-crowning" on={r.crowning} label="CROWNING" detail="The head is crowning. It stays at the vulva." onPress={press(api, 'crowning', 'The head is crowning. It does not slip back.')} />
      <Btn id="nurse-sign-perineum" on={r.perineum} label="VULVA GAPING, PERINEUM BULGING" detail="The vulva is gaping and the perineum is bulging." onPress={press(api, 'perineum', 'The vulva is gaping and the perineum is bulging.')} />
      <Btn id="nurse-sign-anus" on={r.anus} label="ANUS POUTING" detail="The anus is pouting." onPress={press(api, 'anus', 'The anus is pouting.')} />
      <Btn id="nurse-sign-push" on={r.push} label="“I HAVE TO PUSH”" detail="Mrs Lai: “I have to push.” She cannot stop it." onPress={press(api, 'push', 'Mrs Lai: “I have to push.” It is involuntary.')} />
    </>
  )
}

function AskButtons(api: S) {
  const r = api.run
  return (
    <>
      <Btn id="nurse-ask-liquor" on={r.liquorAsk} label="ASK: THE WATERS" detail="Mrs Lai: The waters are clear." onPress={press(api, 'liquorAsk', 'Mrs Lai: “The waters are clear.”')} />
      <Btn id="nurse-ask-allergy" on={r.allergy} label="ASK: ALLERGIES AND MEDICINES" detail="Mrs Lai: No allergies. No medicines." onPress={press(api, 'allergy', 'Mrs Lai: “No allergies, and no medicines.”')} />
      <Btn id="nurse-ask-obstetric" on={r.obstetric} label="ASK: THIS PREGNANCY" detail="Mrs Lai: One baby. No previous caesarean. No bleed." onPress={press(api, 'obstetric', 'Mrs Lai: “One baby. No previous caesarean. No bleed.”')} />
      <Btn id="nurse-ask-weeks" on={r.weeks} label="ASK: HOW MANY WEEKS" detail="Mrs Lai: 39 weeks. This is my second pregnancy." onPress={press(api, 'weeks', 'Mrs Lai: “39 weeks. This is my second.”')} />
    </>
  )
}

function PrepareButtons(api: S) {
  const r = api.run
  return (
    <>
      <Btn id="nurse-ppe" on={r.ppe} label="GOWN, EYE PROTECTION, STERILE GLOVES" detail="Gown on, eyes covered, sterile gloves." onPress={press(api, 'ppe', 'Gown, eye protection, sterile gloves.')} />
      <Btn id="nurse-set" on={r.set} label="STERILE DELIVERY SET" detail="Two straight artery forceps, cord scissors, two cord clamps." onPress={press(api, 'set', 'Sterile delivery set: two straight artery forceps, cord scissors, two cord clamps.')} />
      <Btn id="nurse-pad" on={r.pad} label="CHLORHEXIDINE AND A MATERNITY PAD" detail="Chlorhexidine and a maternity pad are on the trolley." onPress={press(api, 'pad', 'Chlorhexidine and a maternity pad, on the trolley.')} />
      <Btn id="nurse-drug-out" on={r.drugOut} label="SYNTOMETRINE 1 ml ON THE TROLLEY" detail="The ampoule is on the trolley. You have not given it. No ATT injection." onPress={press(api, 'drugOut', 'Syntometrine 1 ml is on the trolley. You do not give it yet. There is no ATT injection.')} />
      <Btn id="nurse-bottles" on={r.bottles} label="EDTA FOR G6PD, CLOTTED BOTTLE FOR TSH" detail="Both bottles are out, not labelled yet." onPress={press(api, 'bottles', 'An EDTA bottle for G6PD and a clotted bottle for TSH.')} />
      <Btn id="nurse-form" on={r.form} label="BBA/BOA FORM" detail="The BBA/BOA form is out." onPress={press(api, 'form', 'The BBA/BOA form is ready.')} />
      <Btn id="nurse-explain" on={r.explain} label="THE BIRTH WILL HAPPEN HERE IN A&E" detail="You told her, and you stay with her." onPress={press(api, 'explain', 'You tell her the birth will happen here in A&E, and you stay with her.')} />
      <Btn id="nurse-consent" on={r.consent} label="VERBAL CONSENT IF SHE NEEDS AN EPISIOTOMY" detail="Mrs Lai agrees, if Nurse Chiu needs to cut." onPress={press(api, 'consent', 'You ask if Nurse Chiu may do an episiotomy if she needs to. Mrs Lai agrees.')} />
    </>
  )
}

function BirthButtons(api: S) {
  const r = api.run
  return (
    <>
      <Btn id="nurse-time" on={r.time} label="CALL THE TIME OF BIRTH" detail="You called the time. It is written down." onPress={press(api, 'time', 'You call the time of birth.')} />
      <Btn id="nurse-cord" on={r.cord} label="NO CORD AROUND THE NECK" detail="No cord around the neck." onPress={press(api, 'cord', 'You look: no cord around the neck.')} />
      <Btn id="nurse-liquor" on={r.liquor} label="LIQUOR IS CLEAR" detail="The liquor is clear." onPress={press(api, 'liquor', 'The liquor is clear.')} />
      <Btn id="nurse-show" on={r.shown} label="SHOW HER THE BABY" detail="Mrs Lai: “A girl.”" onPress={press(api, 'shown', 'You show her the baby. Mrs Lai: “A girl.”')} />
      <Btn id="nurse-look" on={r.birthmark} label="LOOK: NO BIRTHMARK" detail="No birthmark." onPress={press(api, 'birthmark', 'You look her over with her mother: no birthmark.')} />
      <p className="io-small mt-2">Clamp the cord. At least 2.5 cm from the umbilicus. The line is the nearest safe place.</p>
      <ClampPicture
        run={r}
        onPick={(cm) => {
          const patch = chooseClamp(api.runRef.current, cm)
          const placed = patch?.clampCm
          if (placed == null) return
          api.upd({ clampCm: placed })
          sfx.select()
          api.feel(placed >= MIN_CLAMP_CM ? `Clamp on at ${placed.toFixed(1)} cm from the umbilicus.` : `${placed.toFixed(1)} cm is closer than 2.5 cm. REDO THIS STEP and tap further from the baby.`)
        }}
      />
    </>
  )
}

function DrugButtons(api: S) {
  const r = api.run
  return (
    <>
      <Btn id="nurse-palpate" on={r.palpated} label="PALPATE: NO SECOND TWIN" detail="One baby. No second twin." onPress={press(api, 'palpated', 'One baby. The uterus is the size of a single pregnancy. No second twin.')} />
      <Btn
        id="nurse-syntometrine"
        on={r.syntometrine && !r.drugEarly}
        label="SYNTOMETRINE 1 ml IM"
        detail={r.drugEarly ? 'Given before you palpated. Redo this step.' : 'Syntometrine 1 ml intramuscular, after the palpation.'}
        onPress={() => {
          const patch = giveSyntometrine(api.runRef.current)
          if (!patch) return
          api.upd(patch)
          sfx.select()
          api.feel(patch.drugEarly ? 'Syntometrine is in, but you have not felt for a second twin. REDO THIS STEP and palpate first.' : 'Syntometrine 1 ml intramuscular, now that you have felt one baby only.')
        }}
      />
      <Btn id="nurse-drug-time" on={r.drugTime} label="RECORD THE INJECTION TIME" detail="The injection time is written down." onPress={press(api, 'drugTime', 'You record the time of the syntometrine.')} />
      <Btn id="nurse-label-edta" on={r.edta} label="LABEL THE EDTA BOTTLE" detail="EDTA, Mrs Lai, G6PD." onPress={press(api, 'edta', 'EDTA bottle labelled with Mrs Lai’s details, for G6PD.')} />
      <Btn id="nurse-label-clotted" on={r.clotted} label="LABEL THE CLOTTED BOTTLE" detail="Clotted bottle, Mrs Lai, TSH." onPress={press(api, 'clotted', 'Clotted bottle labelled with Mrs Lai’s details, for TSH.')} />
    </>
  )
}

function MotherButtons(api: S) {
  const r = api.run
  return (
    <>
      <Btn id="nurse-sign-gush" on={r.gush} label="GUSH OF BLOOD" detail="A gush of blood." onPress={press(api, 'gush', 'A gush of blood at the vulva.')} />
      <Btn id="nurse-sign-length" on={r.lengthen} label="CORD LENGTHENING" detail="The cord is lengthening." onPress={press(api, 'lengthen', 'The cord lengthens. You do not pull it.')} />
      <Btn id="nurse-sign-fundus" on={r.fundus} label="FUNDUS FIRM, GLOBULAR, RISEN" detail="The fundus is firm, globular, and risen." onPress={press(api, 'fundus', 'The fundus is firm, globular, and risen.')} />
      <Btn id="nurse-vessels" on={r.vessels} label="TWO ARTERIES AND ONE VEIN" detail="Two arteries and one vein." onPress={press(api, 'vessels', 'The cut end shows two arteries and one vein.')} />
      <Btn id="nurse-bag" on={r.bag} label="SEAL THE PLACENTA IN A LABELLED BAG" detail="Sealed, labelled with Mrs Lai’s details." onPress={press(api, 'bag', 'The placenta is sealed in a bag labelled with Mrs Lai’s details. You did not pull on the cord.')} />
      <Btn id="nurse-pad-on" on={r.padOn} label="MATERNITY PAD" detail="A maternity pad is on." onPress={press(api, 'padOn', 'Maternity pad on.')} />
      <Btn id="nurse-warm" on={r.warm} label="KEEP HER WARM AND DRY" detail="Warm and dry." onPress={press(api, 'warm', 'You keep her warm and dry.')} />
      <Btn id="nurse-loss" on={r.loss} label="ESTIMATE THE BLOOD LOSS" detail="Not a haemorrhage. Primary PPH is more than 500 ml." onPress={press(api, 'loss', 'You estimate the loss. It is not a haemorrhage. Primary postpartum haemorrhage is more than 500 ml.')} />
      <Btn id="nurse-pulse" on={r.pulse} label="RECHECK HER PULSE" detail="Pulse rechecked. She is not shocked." onPress={press(api, 'pulse', 'Pulse rechecked. She is not shocked.')} />
    </>
  )
}

function HandoverButtons(api: S) {
  const r = api.run
  return (
    <>
      <Btn id="nurse-stable" on={r.stable} label="MOTHER AND BABY STABLE" detail="Both stable." onPress={press(api, 'stable', 'Mother and baby are both stable.')} />
      <Btn id="nurse-ward" on={r.ward} label="CALL THE LABOUR WARD" detail="The labour ward has been called." onPress={press(api, 'ward', 'You call the labour ward.')} />
      <Btn id="nurse-specimens" on={r.specimens} label="BOTTLES AND PLACENTA GO WITH HER" detail="Labelled bottles and the sealed placenta go with her." onPress={press(api, 'specimens', 'The labelled bottles and the sealed placenta go with her.')} />
      <Btn id="nurse-papers" on={r.papers} label="A&E CHARTS AND BBA/BOA" detail="A&E charts and the BBA/BOA form." onPress={press(api, 'papers', 'A&E charts for mother and baby, and the BBA/BOA form.')} />
      <Btn id="nurse-escort" on={r.escort} label="ESCORT, TRANSFER BAG, AND A PHONE" detail="An escort goes with them, with the transfer bag and a phone." onPress={press(api, 'escort', 'An escort goes with them, carrying the transfer bag and a phone.')} />
    </>
  )
}
