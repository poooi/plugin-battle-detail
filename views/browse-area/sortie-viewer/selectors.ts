import _ from 'lodash'
import { List } from 'immutable'
import { createSelector } from 'reselect'
import {
  sortieViewerSelector,
  sortieIndexesSelector,
} from '../../selectors'
import type { ParsedMapId } from '../../store/records'
import { parseEffMapId, getFcdMapInfoFuncSelector } from '../../store/records'
import type { SortieIndex } from '../../store/ext-root/sortie-indexes'
import type { SortieViewerState } from '../../store/ext-root/ui'

const grouppedSortieIndexesSelector = createSelector(
  sortieIndexesSelector,
  (si: List<SortieIndex>) => si.groupBy((x: SortieIndex) => x.effMapId),
)

export const sortieIndexesDomainSelector = createSelector(
  grouppedSortieIndexesSelector,
  sortieViewerSelector,
  (grpdSortieIndexes, { sortBy: { method, reversed } }: SortieViewerState) => {
    let p1Maps: string[] = []
    let p2Maps: string[] = []
    for (const effMapId of grpdSortieIndexes.keys()) {
      const parsed = parseEffMapId(effMapId)
      if (parsed === 'pvp') continue
      if (parsed === null) {
        console.warn(`skipping ${effMapId} due to parse error.`)
        continue
      }
      if (parsed.phase === 1) {
        p1Maps.push(effMapId)
      } else if (parsed.phase === 2) {
        p2Maps.push(effMapId)
      } else {
        console.warn(`skipping ${effMapId} due to unknown phase.`)
      }
    }

    if (method === 'recent') {
      // already sorted in recent order
    } else if (method === 'numeric') {
      const compare = (x: string, y: string) =>
        (parseEffMapId(x) as ParsedMapId).mapId - (parseEffMapId(y) as ParsedMapId).mapId
      p1Maps.sort(compare)
      p2Maps.sort(compare)
    } else {
      console.warn(`invalid sort method: ${method}`)
    }

    if (reversed) {
      p1Maps = p1Maps.reverse()
      p2Maps = p2Maps.reverse()
    }

    return ['all', 'pvp', ...p2Maps, ...p1Maps]
  },
)

const getSortieIndexesFuncSelector = createSelector(
  sortieIndexesSelector,
  grouppedSortieIndexesSelector,
  (sortieIndexes: List<SortieIndex>, gSortieIndexes) => (mId: string) =>
    mId === 'all' ? sortieIndexes :
      gSortieIndexes.has(mId) ? gSortieIndexes.get(mId) : List(),
)

const viewingMapIdSelector = createSelector(
  sortieViewerSelector,
  (sv: SortieViewerState) => sv.viewingMapId,
)

const activePageSelector = createSelector(
  sortieViewerSelector,
  (sv: SortieViewerState) => sv.activePage,
)

const currentSortieIndexesSelector = createSelector(
  getSortieIndexesFuncSelector,
  viewingMapIdSelector,
  (getSortieIndexesFunc, mId: string) => getSortieIndexesFunc(mId),
)

const itemsPerPage = 20

export const pageRangeSelector = createSelector(
  currentSortieIndexesSelector,
  (sortieIndexes) => Math.ceil((sortieIndexes?.size ?? 0) / itemsPerPage),
)

export const currentFocusingSortieIndexesSelector = createSelector(
  currentSortieIndexesSelector,
  activePageSelector,
  (sortieIndexes, activePage: number) => {
    if (!sortieIndexes) return List<SortieIndex>()
    const beginInd = (activePage - 1) * itemsPerPage
    const endInd = Math.min(beginInd + itemsPerPage - 1, sortieIndexes.size - 1)
    return sortieIndexes.slice(beginInd, endInd + 1)
  },
)

export const getMapNodeLetterFuncSelector = createSelector(
  getFcdMapInfoFuncSelector,
  (getFcdMapInfo) => (effMapId: string) => {
    const routeInfo = _.get(getFcdMapInfo(effMapId), 'route')
    if (_.isEmpty(routeInfo)) return (edgeId: number | string) => String(edgeId)
    return (edgeId: number | string) => routeInfo[edgeId][1]
  },
)
