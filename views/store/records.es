/*

   the maintenance for the transition from p1 to p2 was started at:

   - 2018-08-14 23:55 JST (or perhaps +10 mins as usual)

   (reference: https://twitter.com/KanColle_STAFF/status/1029535566986014720)

   and was ended at:

   - 2018-08-17 18:00 JST

   (reference: https://twitter.com/KanColle_STAFF/status/1029892523185958912)

   technically any time in between should be good enough.

 */
const p1Cutoff = Number(new Date('2018-08-17T00:00:00+09:00'))

/*
   EffMapId is a string that not only represents map id
   but make explicit the concept of phase:
   due to the fact that old data (phase 1) is completely a different story
   than newer ones (phase 2), we'll have to make this distinction.

   the string format is `${mapId}p${phase}`, in which phase
   can only be 1 or 2.

   examples:

   - 11p1: 1-1 of phase 1
   - 422p1: 42-2 of phase 1
   - 72p2: 7-2 of phase 2

 */

/*
   convert MapId to EffMapId with a timestamp (must be number).
 */
const toEffMapId = (mapId, timestamp) => {
  const phase = timestamp > p1Cutoff ? 2 : 1
  return `${mapId}p${phase}`
}

// - f : (mapId: Number, phase: 1 or 2) => ret typ of f
// - withEffMapId(EffMapId)(f) => ret typ of f
const withEffMapId = eMapId => do {
  const matchResult = /^(\d+)p(1|2)$/.exec(eMapId)
  if (!matchResult) {
    console.error(`parse error: ${eMapId} is not a valid EffMapId`)
    f => f(null)
  } else {
    const [_ignored, mapIdStr, phaseStr] = matchResult
    const mapId = Number(mapIdStr)
    const phase = Number(phaseStr)
    // use currying to avoid redundant parsing steps
    f => f(mapId, phase)
  }
}

export {
  toEffMapId,
  withEffMapId,
}
