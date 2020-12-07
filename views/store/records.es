/*
   TODO: might be helpful to split into more modules

   this module contains a bunch of building block responsible for
   making p1 and p2 data battle data universally accessible and useful.
 */
import _ from 'lodash'
import { createSelector } from 'reselect'
import { join } from 'path-extra'
import { readJsonSync } from 'fs-extra'

import { fcdSelector } from 'views/utils/selectors'

const fcdMapP1Raw = readJsonSync(
  join(__dirname, '..', '..', 'assets', 'data', 'fcd-map-p1.json')
)

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
   EffMapId is a string that not only represents map id (Eff for effective)
   but make explicit the concept of phase:
   due to the fact that old data (phase 1) is completely a different story
   than newer ones (phase 2), we'll have to make this distinction.

   the string format is `${mapId}p${phase}`, in which phase
   can only be 1 or 2.

   for pvp that this is fixed to "pvp" as effective map id.

   examples:

   - 11p1: 1-1 of phase 1
   - 422p1: 42-2 of phase 1
   - 72p2: 7-2 of phase 2

 */

/*
   convert MapId to EffMapId with a timestamp (must be number).
 */
const toEffMapId = (mapId, timestamp) => {
  if (!mapId)
    return 'pvp'
  const phase = timestamp > p1Cutoff ? 2 : 1
  return `${mapId}p${phase}`
}

// - f : (mapId: Number, phase: 1 or 2) => ret typ of f
// - withEffMapId(EffMapId)(f) => ret typ of f
// if f receives `null` as mapId, we've failed at parsing
const withEffMapId = eMapId => do {
  if (eMapId === 'pvp') {
    f => f('pvp')
  } else {
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
}

/*
   get FCD map data using EffMapId.
   note that this is a selector, which requires a valid store state
   for accessing phase-2 data
 */
const getFcdMapInfoFuncSelector = createSelector(
  fcdSelector,
  fcd => effMapId => withEffMapId(effMapId)((mapId, phase) => {
    if (mapId === null)
      return null
    const num = mapId % 10
    const world = Math.round((mapId - num) / 10)
    // in the form of `X-Y`
    const fcdMapId = `${world}-${num}`

    if (phase === 1) {
      return _.get(fcdMapP1Raw, ['data', fcdMapId], null)
    }

    if (phase === 2) {
      return _.get(fcd, ['map', fcdMapId], null)
    }

    return null
  })
)

const debug = true

if (debug) {
  const {selectorTester} = require('subtender/poi')
  selectorTester(getFcdMapInfoFuncSelector)

  /*
   usage:

   > testSelector(f => console.log(f('25p1')))
   > testSelector(f => console.log(f('25p2')))

   */
}

export {
  toEffMapId,
  withEffMapId,
  getFcdMapInfoFuncSelector,
}
