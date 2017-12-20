import _ from 'lodash'
import { createSelector } from 'reselect'
import { fcdSelector } from 'views/utils/selectors'

import {
  prepareNextEdges,
  mapStrToMapId,
  checkSortieIndexes,
} from './groupping'
import { indexesSelector, sortieViewerSelector } from '../../selectors'

/*
   the "mapCanGoFromToFunc" is a function:

   mapCanGoFromToFunc(<mapId>)(<beginEdgeId>,<endEdgeId>) = <bool>

   the <bool> indicates whether it's possible to go from edge <beginEdgeId>
   to <endEdgeId> in <mapId>

   the function is curried in this way to avoid some key-resolving
   while memoizing.

 */
const mapCanGoFromToFuncSelector = createSelector(
  fcdSelector,
  fcd => {
    const fcdMap = _.get(fcd,'map')
    // false when fcd data is not available
    if (_.isEmpty(fcdMap)) {
      return _mapId => (_begin, _end) => false
    }

    return _.memoize(mapId => {
      const mArea = Math.floor(mapId/10)
      const mNum = mapId % 10
      const mapStr = `${mArea}-${mNum}`
      const mapInfo = _.get(fcdMap,mapStr)

      // false when fcd data of that map is not available
      if (_.isEmpty(mapInfo)) {
        return (_begin, _end) => false
      }

      const nextEdges = prepareNextEdges(mapInfo)
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
    })
  }
)

/*
   a SortieIndex describes a sequence of battle record indexes which
   can be consider a single sortie.

   it is represented by the following structure:

   - {indexes: <Array of index, ascending by id>, mapId: <mapId or 'pvp'>}

 */
const sortieIndexesSelector = createSelector(
  indexesSelector,
  mapCanGoFromToFuncSelector,
  (indexes, mapCanGoFromToFunc) => {
    const sortieIndexes = []

    let i = 0
    while (i < indexes.length) {
      const curIndex = indexes[i]
      const curMapId = mapStrToMapId(curIndex.map)
      if (curMapId === null) {
        console.warn(
          `failed to parse map string: ${curIndex.map} of data ${curIndex.id}, skipping.`
        )
        ++i
        continue
      }

      if (curMapId === 'pvp') {
        sortieIndexes.push({indexes: [curIndex], mapId: 'pvp'})
        ++i
        continue
      }

      let j = i
      // INVARIANT: i~j (inclusive) should be considered same sortie
      for (_.noop() ; j+1 < indexes.length; ++j) {
        const nextIndex = indexes[j+1]
        const nextMapId = mapStrToMapId(nextIndex.map)
        if (nextMapId !== curMapId)
          break
        const beginEdgeId = nextIndex.route_
        const endEdgeId = indexes[j].route_
        if (!mapCanGoFromToFunc(curMapId)(beginEdgeId,endEdgeId))
          break
      }

      sortieIndexes.push({
        indexes: indexes.slice(i,j+1).reverse(),
        mapId: curMapId,
      })
      i = j+1
    }

    // checking correctness
    checkSortieIndexes(sortieIndexes, mapCanGoFromToFunc)

    return sortieIndexes
  }
)

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

export {
  sortieIndexesSelector,
  sortieIndexesDomainSelector,
  getSortieIndexesFuncSelector,
  pageRangeSelector,
  currentFocusingSortieIndexesSelector,
}
