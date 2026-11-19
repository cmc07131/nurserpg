import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { installKeyboard } from '~/game/input'
import { useSettings } from '~/game/settings'
import { startJazz, stopJazz } from '~/game/sfx'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover' },
      { title: 'Nurse RPG' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  useEffect(() => {
    installKeyboard()
    useSettings.getState().load()
    const kick = () => {
      if (useSettings.getState().sound) startJazz()
    }
    const unsub = useSettings.subscribe((state, prev) => {
      if (state.sound === prev.sound) return
      if (state.sound) startJazz()
      else stopJazz()
    })
    window.addEventListener('pointerdown', kick)
    window.addEventListener('keydown', kick)
    return () => {
      unsub()
      window.removeEventListener('pointerdown', kick)
      window.removeEventListener('keydown', kick)
      stopJazz()
    }
  }, [])
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
