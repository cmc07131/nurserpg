import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { loadPack } from '~/engine/loadPacks'
import { applyRole, parseRole, writeRole } from '~/game/delivery/roles'
import { PlayView } from '~/game/PlayView'

export const Route = createFileRoute('/play/$packId')({
  validateSearch: (search: Record<string, unknown>) => {
    const role = parseRole(search.role)
    return { role }
  },
  loader: ({ params }) => loadPack(params.packId),
  pendingComponent: Opening,
  component: PlayPage,
})

export function Opening() {
  return (
    <div className="page justify-center">
      <p className="win text-center">Opening the station…</p>
    </div>
  )
}

function PlayPage() {
  const { packId } = Route.useParams()
  const { role } = Route.useSearch()
  const hit = Route.useLoaderData()
  const pack = useMemo(() => (hit.ok ? applyRole(hit.pack, role) : null), [hit, role])
  useEffect(() => {
    writeRole(role)
  }, [role])
  if (!hit.ok || !pack) {
    return (
      <div className="page justify-center">
        <p className="win">
          Station {packId} did not load. {hit.ok ? '' : hit.error}
        </p>
        <Link to="/" className="tap block text-center">
          Back to the title
        </Link>
      </div>
    )
  }
  return <PlayView pack={pack} />
}
