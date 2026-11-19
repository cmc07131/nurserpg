import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { ROLES, writeRole, type RoleId } from '~/game/delivery/roles'
import { useButtons } from '~/game/input'
import { useSettings } from '~/game/settings'
import { sfx } from '~/game/sfx'
import { Sprite } from '~/game/Sprite'
import { NavItem, Win, useCursor } from '~/game/ui'

export const Route = createFileRoute('/')({
  component: TitlePage,
})

const CHOICES: RoleId[] = ['doctor', 'midwife', 'nurse']

function TitlePage() {
  const navigate = useNavigate()
  const [started, setStarted] = useState(false)
  const menu = useRef<HTMLDivElement>(null)
  const sound = useSettings((s) => s.sound)
  const toggleSound = useSettings((s) => s.toggleSound)

  function start() {
    sfx.select()
    setStarted(true)
  }

  function play(role: RoleId) {
    writeRole(role)
    void navigate({ to: '/play/$packId', params: { packId: 'og-delivery' }, search: { role } })
  }

  useButtons(5, !started, (btn) => {
    if (btn === 'a' || btn === 'start') start()
  })
  useCursor(menu, { priority: 10, enabled: started, onBack: () => setStarted(false) })

  return (
    <div className="page title-page" onClick={() => !started && start()}>
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="title-sub">A NORMAL BIRTH</p>
        <h1 className="title-logo">
          NURSE
          <br />
          RPG
        </h1>
        <p className="title-sub">CHOOSE WHO YOU ARE</p>
        <div className="title-stage">
          <Sprite role="nurse" facing="e" walk />
          <Sprite role="doctor" facing="e" walk scale={4} />
          <Sprite role="nurse" facing="w" walk />
        </div>
      </div>
      {!started ? (
        <p className="press-start mb-10" data-testid="enter-title">
          PRESS START
        </p>
      ) : (
        <div ref={menu} className="mb-6">
          <Win>
            {CHOICES.map((id) => (
              <NavItem key={id} testId={`role-${id}`} onClick={() => play(id)}>
                {ROLES[id].short.toUpperCase()}
                <span className="nav-need">{ROLES[id].blurb}</span>
              </NavItem>
            ))}
            <NavItem testId="title-sound" onClick={toggleSound}>
              SOUND: {sound ? 'ON' : 'OFF'}
            </NavItem>
          </Win>
        </div>
      )}
      <p className="title-foot">Practice for a normal birth · not medical advice · not affiliated with Nintendo</p>
    </div>
  )
}
