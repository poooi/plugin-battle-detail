import _ from 'lodash'
import { createSelector } from 'reselect'
import { fcdSelector } from 'views/utils/selectors'

import { prepareNextEdges } from './groupping'
import { indexesSelector } from '../../selectors'

const indexesGrouppedByMapSelector = createSelector(
  indexesSelector,
  xs => _.groupBy(xs, x => x.map || 'pvp')
)

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

const mapStrToMapId = _.memoize(mapStr => {
  if (mapStr === '')
    return 'pvp'
  const matchResult = /^(\d+)-(\d+)$/.exec(mapStr)
  if (!matchResult)
    return null
  const [_ignored, areaStr, numStr] = matchResult
  return Number(areaStr)*10 + Number(numStr)
})

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
        const endEdgeId = curIndex.route_
        if (!mapCanGoFromToFunc(curMapId)(beginEdgeId,endEdgeId))
          break
      }

      sortieIndexes.push({
        indexes: indexes.slice(i,j+1).reverse(),
        mapId: curMapId,
      })
      i = j+1
    }

    return sortieIndexes
  }
)

import { selectorTester } from 'subtender/poi'
selectorTester(sortieIndexesSelector)

export {
  indexesGrouppedByMapSelector,
  mapCanGoFromToFuncSelector,
}
