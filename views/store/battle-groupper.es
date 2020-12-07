/*

  This module deals with a sorted Array of battles and group them
  into sorties.

 */

import {
  toEffMapId,
} from './records'

const groupBattleIndexes = _store => battles => {
  const battleCounts = new Map()
  battles.forEach(battle => {
    const mapIdStr = battle.map.split('-').join('')
    const effMapId = toEffMapId(mapIdStr, battle.time_)

    if (battleCounts.has(effMapId)) {
      battleCounts.set(effMapId, battleCounts.get(effMapId) + 1)
    } else {
      battleCounts.set(effMapId, 1)
    }
  })
  const xs = [...battleCounts.entries()]
  xs.sort((a,b) => {
    const l = a[0]
    const r = b[0]
    return l < r ? -1 : l > r ? 1 : 0
  })
  xs.forEach(e => console.log(e))
}

export { groupBattleIndexes }
