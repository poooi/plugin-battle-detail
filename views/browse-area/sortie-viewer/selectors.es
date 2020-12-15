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

/*
  TODO: original sortieIndexesSelector uses Array and for elements
  mapId is used to identify the viewing map.
  But for our new store-based structure, immutable List and effMapId is used instead.
 */

/*
  TODO: should new structure have some verification like `checkSortieIndexes`?
 */

/*
   an Array whose values are all valid for getSortieIndexesFunc (thus the "domain")
   sorting methods are respected here.
 */
const sortieIndexesDomainSelector = createSelector(
  sortieIndexesSelector,
  sortieViewerSelector,
  (sortieIndexes, {sortBy: {method, reversed}}) => {
    /*
       - _.uniq is guaranteed to keep only the first element when there're duplicates
       - sortieIndexes is guaranteed to keep more recent ones in front
       - therefore "domain" is naturally already sorted in "recent" mode
     */
    const domain = _.uniq(
      sortieIndexes.map(si => si.mapId).filter(x => x !== 'pvp')
    )

    let sortedDomain
    if (method === 'recent') {
      sortedDomain = domain
    } else if (method === 'numeric') {
      sortedDomain = domain.sort((x,y) => x-y)
    } else {
      console.warn(`invalid sort method: ${method}`)
      sortedDomain = domain
    }

    if (reversed)
      sortedDomain = sortedDomain.reverse()

    // make 'all' and 'pvp' always in front, in that order.
    sortedDomain.unshift('pvp')
    sortedDomain.unshift('all')
    // ['all', 'pvp', <mapId> ...]
    return sortedDomain
  }
)

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
}
