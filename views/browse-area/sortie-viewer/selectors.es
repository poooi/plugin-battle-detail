/*
  TODO: Note that for now this entire module is not imported anywhere, we'll need to recover
  those selectors first.
 */

import _ from 'lodash'
import { createSelector } from 'reselect'
import { fcdSelector } from 'views/utils/selectors'
import { mapIdToStr } from 'subtender/kc'
import {
  sortieViewerSelector,
  sortieIndexesSelector,
} from '../../selectors'
import {
  parseEffMapId,
} from '../../store/records'


/*
  Selects an immutable OrderedMap from EffMapId to List of sorties, order preserved.

  Note that since keys are ordered in which they were set,
  iterating through elements will also give us most recently sortied maps.

 */
const grouppedSortieIndexesSelector = createSelector(
  sortieIndexesSelector,
  si => si.groupBy(x => x.effMapId)
)

/*
  TODO: should new structure have some verification like `checkSortieIndexes`?
 */

/*
   an Array whose values are all valid for getSortieIndexesFunc (thus the "domain")
   sorting methods are respected within game phases.

   We have 4 categories in the following order:

   - 'all' always in front
   - 'pvp' always the second one
   - phase2 (current) maps
   - phase1 (old) maps

   And `sortBy` will only have effect on phase2 and phase1 maps.
   The intention is to always place phase2 maps in front regardless of sorting method
   and whether we are reversing the order - as user would most likely view p2 maps more often than p1 maps.
 */
const sortieIndexesDomainSelector = createSelector(
  grouppedSortieIndexesSelector,
  sortieViewerSelector,
  (grpdSortieIndexes, {sortBy: {method, reversed}}) => {
    let p1Maps = []
    let p2Maps = []
    for (const effMapId of grpdSortieIndexes.keys()) {
      const parsed = parseEffMapId(effMapId)
      if (parsed === 'pvp') {
        continue
      }
      if (parsed === null) {
        console.warn(`skipping ${effMapId} due to parse error.`)
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
      // already sorted in recent order thanks to OrderedMap.
    } else if (method === 'numeric') {
      const compare =
        (x,y) => parseEffMapId(x).mapId - parseEffMapId(y).mapId
      p1Maps.sort(compare)
      p2Maps.sort(compare)
    } else {
      console.warn(`invalid sort method: ${method}`)
    }

    if (reversed) {
      p1Maps = p1Maps.reverse()
      p2Maps = p2Maps.reverse()
    }

    // 'all' and 'pvp' always in front, in that order.
    return ['all', 'pvp', ...p2Maps, ...p1Maps]
  }
)

/*
  TODO: original sortieIndexesSelector uses Array and for elements
  mapId is used to identify the viewing map.
  But for our new store-based structure, immutable List and effMapId is used instead.

  TODO: revisit everything below to adapt to new store structure.
 */

/*
   getSortieIndexesByMapFunc(<mapId or 'pvp' or 'all'>)

   returns an Array of all qualifying sortie indexes
 */
const getSortieIndexesFuncSelector = createSelector(
  sortieIndexesSelector,
  sortieIndexes => _.memoize(mapId =>
    mapId === 'all' ? sortieIndexes :
      sortieIndexes.filter(si => si.mapId === mapId)
  )
)

const mapIdSelector = createSelector(
  sortieViewerSelector,
  sv => sv.mapId
)

const activePageSelector = createSelector(
  sortieViewerSelector,
  sv => sv.activePage
)

const currentSortieIndexesSelector = createSelector(
  getSortieIndexesFuncSelector,
  mapIdSelector,
  (getSortieIndexesFunc, mapId) =>
    getSortieIndexesFunc(mapId)
)

const itemsPerPage = 20


const pageRangeSelector = createSelector(
  currentSortieIndexesSelector,
  sortieIndexes => Math.ceil(sortieIndexes.length / itemsPerPage)
)

const currentFocusingSortieIndexesSelector = createSelector(
  currentSortieIndexesSelector,
  activePageSelector,
  (sortieIndexes, activePage) => {
    const beginInd = (activePage-1)*itemsPerPage
    const endInd = Math.min(beginInd+itemsPerPage-1, sortieIndexes.length-1)
    return sortieIndexes.slice(beginInd, endInd+1)
  }
)


const getMapNodeLetterFuncSelector = createSelector(
  fcdSelector,
  fcd => _.memoize(mapId => {
    const routeInfo = _.get(fcd, ['map', mapIdToStr(mapId), 'route'])
    if (_.isEmpty(routeInfo))
      return edgeId => String(edgeId)

    return edgeId => routeInfo[edgeId][1]
  })
)


export {
  sortieIndexesSelector,
  sortieIndexesDomainSelector,
  getSortieIndexesFuncSelector,
  pageRangeSelector,
  currentFocusingSortieIndexesSelector,
  getMapNodeLetterFuncSelector,
  grouppedSortieIndexesSelector,
}
