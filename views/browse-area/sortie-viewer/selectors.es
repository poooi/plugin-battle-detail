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

export {
  indexesGrouppedByMapSelector,
  mapCanGoFromToFuncSelector,
}
