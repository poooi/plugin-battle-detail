import _ from 'lodash'
import { List } from 'immutable'

import { parseBattleMapAndTime, getFcdMapInfoFuncSelector } from './records'
import { prepareNextEdges } from '../browse-area/sortie-viewer/groupping'
import type { SortieIndex } from './ext-root/sortie-indexes'
import type { BattleIndex } from './ext-root/indexes'

type FcdMapInfo = { route: Record<string, [number, number]> }

const mapCanGoFromTo = (mapInfo: FcdMapInfo | null) => {
  if (_.isEmpty(mapInfo)) {
    return (_begin: number, _end: number) => false
  }

  const nextEdges = prepareNextEdges(mapInfo)

  const canGoFromToImpl = (beginEdgeId: number, endEdgeId: number): boolean => {
    const [, beginNode] = mapInfo.route[beginEdgeId]
    const [endNode] = mapInfo.route[endEdgeId]
    if (!beginNode || !endNode) return false

    const search = (curNode: number, remainedSteps = 5): boolean => {
      if (curNode === endNode) return true
      if (remainedSteps <= 0) return false
      const nextEdgeIds = nextEdges[curNode]
      if (!nextEdgeIds) return false
      for (let i = 0; i < nextEdgeIds.length; ++i) {
        const nextEdgeId = nextEdgeIds[i]
        const [, nextNode] = mapInfo.route[nextEdgeId]
        if (search(nextNode, remainedSteps - 1)) return true
      }
      return false
    }
    return search(beginNode)
  }

  const canGoFromTo = _.memoize(
    canGoFromToImpl,
    (eFrom: number, eTo: number) => `${eFrom}=>${eTo}`,
  )

  return canGoFromTo
}

export const groupBattleIndexes = (store: RootState) => (battles: BattleIndex[]): List<SortieIndex> => {
  const sortieIndexes: List<SortieIndex> = (() => {
    const indexes = battles
    const getFcdMapInfo = getFcdMapInfoFuncSelector(store)
    let xs: List<SortieIndex> = List()

    let i = 0
    while (i < indexes.length) {
      const curIndex = indexes[i]
      const parsed = parseBattleMapAndTime(curIndex.map, curIndex.time_)
      if (parsed === null) {
        console.warn(`failed to parse map string: ${curIndex.map} of data ${curIndex.id}, skipping.`)
        ++i
        continue
      }
      const { effMapId } = parsed
      if (effMapId === 'pvp') {
        xs = xs.push({ indexes: [curIndex], effMapId })
        ++i
        continue
      }
      const mapInfo = getFcdMapInfo(effMapId)
      const canGoFromTo = mapCanGoFromTo(mapInfo)

      let j = i
      for (; j + 1 < indexes.length; ++j) {
        const nextIndex = indexes[j + 1]
        const nextParsed = parseBattleMapAndTime(nextIndex.map, nextIndex.time_)
        if (nextParsed === null) break
        const { effMapId: nextEffMapId } = nextParsed
        if (nextEffMapId !== effMapId) break

        const beginEdgeId = nextIndex.route_
        const endEdgeId = indexes[j].route_
        if (!canGoFromTo(beginEdgeId, endEdgeId)) break
      }

      xs = xs.push({ indexes: indexes.slice(i, j + 1).reverse(), effMapId })
      i = j + 1
    }

    return xs
  })()

  return sortieIndexes
}

export const insertIndex = (store: RootState) => (
  sortieIndexes: List<SortieIndex>,
  newId: number,
  newIndex: BattleIndex,
): List<SortieIndex> => {
  const curSortieIndex = sortieIndexes.first(null)
  const lastIndex = _.last(_.get(curSortieIndex, 'indexes'))
  if (newId === _.get(lastIndex, 'id')) {
    if (_.isEqual(lastIndex, newIndex)) return sortieIndexes

    const newIndexes = curSortieIndex!.indexes.slice()
    newIndexes[newIndexes.length - 1] = newIndex
    return sortieIndexes.set(0, { ...curSortieIndex!, indexes: newIndexes })
  }

  const parsed = parseBattleMapAndTime(newIndex.map, newIndex.time_)
  if (parsed === null) {
    console.error(`parsing index failed: ${newIndex.map}, ${newIndex.time_}, skipping.`)
    return sortieIndexes
  }
  const { effMapId } = parsed
  if (!curSortieIndex || effMapId === 'pvp' || effMapId !== curSortieIndex.effMapId) {
    return sortieIndexes.unshift({ indexes: [newIndex], effMapId })
  }

  const getFcdMapInfo = getFcdMapInfoFuncSelector(store)
  const mapInfo = getFcdMapInfo(effMapId)
  const canGoFromTo = mapCanGoFromTo(mapInfo)
  const beginEdgeId = (curSortieIndex.indexes[curSortieIndex.indexes.length - 1]).route_
  const endEdgeId = newIndex.route_
  if (canGoFromTo(beginEdgeId, endEdgeId)) {
    return sortieIndexes.set(0, { ...curSortieIndex, indexes: [...curSortieIndex.indexes, newIndex] })
  } else {
    return sortieIndexes.unshift({ indexes: [newIndex], effMapId })
  }
}

export { mapCanGoFromTo }
