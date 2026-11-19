/**
 * Stations the author has personally been through and signed off: they show a REVIEWED tag in the gym lists and on
 * the station's own screen. Add a station's id here once you have reviewed it.
 */
export const REVIEWED: ReadonlySet<string> = new Set([
  // Legacy packs still on disk for the engine tests. This copy's station is the normal delivery.
  'io-em-01',
  'cv-em-02',
  'aw-em-01',
])

export const isReviewed = (id: string) => REVIEWED.has(id)
