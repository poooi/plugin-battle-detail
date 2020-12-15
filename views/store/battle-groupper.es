/*

  This module deals with a sorted Array of battles and group them
  into sorties.

 */

import _ from 'lodash'
import { List } from 'immutable'

import {
  parseBattleMapAndTime,
  getFcdMapInfoFuncSelector,
} from './records'

import {
  prepareNextEdges,
} from '../browse-area/sortie-viewer/groupping'

const mapCanGoFromTo = mapInfo => {
  if (_.isEmpty(mapInfo)) {
    return (_begin, _end) => false
  }

  const nextEdges = prepareNextEdges(mapInfo)
  /*
    TODO: Regarding this implementation, we can do better than relying the "5 steps assumption" described below:
    we can treat edge ids as labels and propagate them forward (though BFS, probably) along viable paths.
    This way answering whether going (directly or indirectly due to missing nodes) from edge u to edge v is possible
    is simply querying on labels attached to edge v and asking whether edge u is there - preprocessing requried but
    we can get rid of memoization.
   */
  // if it's possible to go from one edge to another
  const canGoFromToImpl = (beginEdgeId, endEdgeId) => {
    /*
       to go from one edge to another means to go from end node of 'beginEdgeId'
       to begin node of `endEdgeId`.
     */
    const [_node1, beginNode] = mapInfo.route[beginEdgeId]
    const [endNode, _node2] = mapInfo.route[endEdgeId]
    if (!beginNode || !endNode)
      return false

    /*
       let's assume that it's only possible to go from one edge to another
       if it can be done within 5 steps. The definition of a step
       is to go from one node to another one through an edge.
     */
    const search = (curNode, remainedSteps = 5) => {
      if (curNode === endNode)
        return true
      if (remainedSteps <= 0)
        return false
      const nextEdgeIds = nextEdges[curNode]
      if (!nextEdgeIds)
        return false
      for (let i=0; i<nextEdgeIds.length; ++i) {
        const nextEdgeId = nextEdgeIds[i]
        const [_node, nextNode] = mapInfo.route[nextEdgeId]
        if (search(nextNode,remainedSteps-1))
          return true
      }
      return false
    }
    return search(beginNode)
  }
  const canGoFromTo = _.memoize(
    canGoFromToImpl,
    // key resolving
    (eFrom, eTo) => `${eFrom}=>${eTo}`
  )

  return canGoFromTo
}

const debug = false

const groupBattleIndexes = store => battles => {
  if (debug) {
    const battleCounts = new Map()
    battles.forEach(battle => {
      const parsed = parseBattleMapAndTime(battle.map, battle.time_)
      if (parsed === null) {
        console.warn(`cannot parse: ${battle.map}, ${battle.time_}`)
        return
      }
      const {effMapId} = parsed
      if (battleCounts.has(effMapId)) {
        battleCounts.set(effMapId, battleCounts.get(effMapId) + 1)
      } else {
        battleCounts.set(effMapId, 1)
      }
    })
  }

  /*
    This is the new version of sortieIndexes that uses immutable structures
    for efficient list insertion.
   */
  const sortieIndexes = do {
    const indexes = battles
    const getFcdMapInfo = getFcdMapInfoFuncSelector(store)
    let xs = List()

    let i = 0
    while (i < indexes.length) {
      const curIndex = indexes[i]
      const parsed = parseBattleMapAndTime(curIndex.map, curIndex.time_)
      if (parsed === null) {
        console.warn(
          `failed to parse map string: ${curIndex.map} of data ${curIndex.id}, skipping.`
        )
        ++i
        continue
      }
      const {effMapId} = parsed
      if (effMapId === 'pvp') {
        xs = xs.push({indexes: [curIndex], effMapId})
        ++i
        continue
      }
      const mapInfo = getFcdMapInfo(effMapId)
      const canGoFromTo = mapCanGoFromTo(mapInfo)

      let j = i
      // INVARIANT: i~j (inclusive) should be considered same sortie
      for (_.noop() ; j+1 < indexes.length; ++j) {
        const nextIndex = indexes[j+1]
        const nextParsed = parseBattleMapAndTime(nextIndex.map, nextIndex.time_)
        if (nextParsed === null) {
          // next record is broken, we'll also cut current sortie record here.
          break
        }
        const {effMapId: nextEffMapId} = nextParsed
        if (nextEffMapId !== effMapId)
          break

        const beginEdgeId = nextIndex.route_
        const endEdgeId = indexes[j].route_
        if (!canGoFromTo(beginEdgeId,endEdgeId))
          break
      }

      xs = xs.push({
        indexes: indexes.slice(i,j+1).reverse(),
        effMapId,
      })
      i = j+1
    }

    xs
  }

  return sortieIndexes
}

// note that newIndex might have been existing in sortieIndexes despite its name.
const insertIndex = store => (sortieIndexes, newId, newIndex) => {
  const curSortieIndex = sortieIndexes.first(null)
  const lastIndex = _.last(_.get(curSortieIndex, 'indexes'))
  if (newId === _.get(lastIndex, 'id')) {
    if (_.isEqual(lastIndex, newIndex)) {
      // index is identical to an existing one, return original structure
      return sortieIndexes
    }

    // replacing old last index with this one.
    const newIndexes = curSortieIndex.indexes.slice()
    newIndexes[newIndexes.length-1] = newIndex
    return sortieIndexes.set(0, {
      ...curSortieIndex,
      indexes: newIndexes,
    })
  }

  // actually inserting newIndex
  const parsed = parseBattleMapAndTime(newIndex.map, newIndex.time_)
  if (parsed === null) {
    console.error(`parsing index failed: ${newIndex.map, newIndex.time_}, skipping.`)
    return sortieIndexes
  }
  const {effMapId} = parsed
  if (!curSortieIndex || effMapId === 'pvp' || effMapId !== curSortieIndex.effMapId) {
    return sortieIndexes.unshift({indexes: [newIndex], effMapId})
  }

  // now we have a case where we might be inserting into an existing one
  const getFcdMapInfo = getFcdMapInfoFuncSelector(store)
  const mapInfo = getFcdMapInfo(effMapId)
  const canGoFromTo = mapCanGoFromTo(mapInfo)
  const beginEdgeId = _.last(curSortieIndex.indexes).route_
  const endEdgeId = newIndex.route_
  if (canGoFromTo(beginEdgeId, endEdgeId)) {
    // merge with existing record
    return sortieIndexes.set(0, {
      ...curSortieIndex,
      indexes: [...curSortieIndex.indexes, newIndex],
    })
  } else {
    // insert a new SortieIndex
    return sortieIndexes.unshift({indexes: [newIndex], effMapId})
  }
}

export {
  groupBattleIndexes,
  mapCanGoFromTo,
  insertIndex,
}
