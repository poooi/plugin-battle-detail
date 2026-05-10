import _ from 'lodash'

export const prepareNextEdges = (mapInfo: { route: Record<string, [number, number]> }): Record<number, number[]> => {
  const nextEdges: Record<number, number[]> = {}
  Object.entries(mapInfo.route).forEach(([edgeIdStr, route]) => {
    const [nFrom] = route
    const edgeArr = nextEdges[nFrom] || []
    if (!nFrom) return
    edgeArr.push(Number(edgeIdStr))
    nextEdges[nFrom] = edgeArr
  })
  return nextEdges
}

export const mapStrToMapId = _.memoize((mapStr: string): number | 'pvp' | null => {
  if (mapStr === '') return 'pvp'
  const matchResult = /^(\d+)-(\d+)$/.exec(mapStr)
  if (!matchResult) return null
  const [, areaStr, numStr] = matchResult
  return Number(areaStr) * 10 + Number(numStr)
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const checkSortieIndexes = (sortieIndexes: any[], mapCanGoFromToFunc: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkSortieIndex = (sortieIndex: any): boolean => {
    const { mapId, indexes } = sortieIndex
    const reportProblem = (msg: string) => {
      console.warn(msg)
      console.warn(sortieIndex)
      return false
    }
    if (
      (mapId === 'pvp' || _.isInteger(mapId)) &&
      Array.isArray(indexes) && indexes.length > 0
    ) {
      if (mapId === 'pvp') {
        if (indexes.length !== 1) return reportProblem('expected pvp data to have exactly one record')
        return true
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!indexes.every((index: any) => mapStrToMapId(index.map) === mapId))
          return reportProblem('inconsistent map str encountered')
        const canGoFromTo = mapCanGoFromToFunc(mapId)
        for (let i = 0; i + 1 < indexes.length; ++i) {
          if (!canGoFromTo(indexes[i].route_, indexes[i + 1].route_))
            return reportProblem('infeasible route')
        }
        return true
      }
    } else {
      return reportProblem('incorrect data encountered')
    }
  }
  const isCorrect = sortieIndexes.every(checkSortieIndex)
  if (!isCorrect) console.warn(`correctness check failed.`)
}
