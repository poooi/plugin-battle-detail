import _ from 'lodash'

const prepareNextEdges = mapInfo => {
  // nextEdges[<node>] = Array of edge ids
  const nextEdges = {}
  Object.entries(mapInfo.route).map(([edgeIdStr, [nFrom,_nTo]]) => {
    const edgeArr = nextEdges[nFrom] || []
    if (!nFrom)
      return
    edgeArr.push(Number(edgeIdStr))
    nextEdges[nFrom] = edgeArr
  })
  return nextEdges
}

const mapStrToMapId = _.memoize(mapStr => {
  if (mapStr === '')
    return 'pvp'
  const matchResult = /^(\d+)-(\d+)$/.exec(mapStr)
  if (!matchResult)
    return null
  const [_ignored, areaStr, numStr] = matchResult
  return Number(areaStr)*10 + Number(numStr)
})

const checkSortieIndexes = (sortieIndexes, mapCanGoFromToFunc) => {
  // checking correctness
  const checkSortieIndex = sortieIndex => {
    const {mapId, indexes} = sortieIndex
    const reportProblem = msg => {
      console.warn(msg)
      console.warn(sortieIndex)
      return false
    }
    if (
      (mapId === 'pvp' || _.isInteger(mapId)) &&
      Array.isArray(indexes) && indexes.length > 0
    ) {
      if (mapId === 'pvp') {
        if (indexes.length !== 1) {
          return reportProblem('expected pvp data to have exactly one record')
        }
        return true
      } else {
        if (!indexes.every(index => mapStrToMapId(index.map) === mapId)) {
          return reportProblem('inconsistent map str encountered')
        }
        const canGoFromTo = mapCanGoFromToFunc(mapId)
        for (let i = 0; i+1 < indexes.length; ++i) {
          if (!canGoFromTo(indexes[i].route_, indexes[i+1].route_)) {
            return reportProblem('infeasible route')
          }
        }
        return true
      }
    } else {
      return reportProblem('incorrect data encountered')
    }
  }
  const isCorrect = sortieIndexes.every(checkSortieIndex)
  if (!isCorrect) {
    console.warn(`correctness check failed.`)
  }

  const visualize = false
  if (visualize) {
    const fcdMap = window.getStore().fcd.map
    sortieIndexes.map(sortieIndex => {
      const {mapId, indexes} = sortieIndex
      if (mapId === 'pvp') {
        // eslint-disable-next-line no-console
        console.log(`PvP: ${indexes[0].desc}`)
      } else {
        const area = Math.floor(mapId / 10)
        const num = mapId % 10
        const mapStr = `${area}-${num}`
        const routes = fcdMap[mapStr].route
        const nodesText = indexes.map(index => routes[index.route_][1]).join(' => ')
        // eslint-disable-next-line no-console
        console.log(`Sortie to ${mapStr}: ${nodesText}`)
      }
    })
  }
}

export {
  mapStrToMapId,
  prepareNextEdges,
  checkSortieIndexes,
}
