import _ from 'lodash'
import { unionSorted } from 'subtender'

export interface BattleIndex {
  id: number
  time_: number
  time: string
  map: string
  route_: number
  route: string
  desc: string
  rank: string
}

const mergeIndexes: (a: BattleIndex[], b: BattleIndex[]) => BattleIndex[] =
  unionSorted((x: BattleIndex, y: BattleIndex) => y.id - x.id)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reducer = (state: BattleIndex[] = [], action: any): BattleIndex[] => {
  if (action.type === '@poi-plugin-battle-detail@atomicReplaceIndexes') {
    return action.indexes
  }

  if (action.type === '@poi-plugin-battle-detail@indexesMerge') {
    return mergeIndexes(state, action.newIndexes)
  }

  if (action.type === '@poi-plugin-battle-detail@notifyIndex') {
    const { newId, newIndex } = action

    if (_.isEqual(state[0], newIndex)) return state

    let indexes = state.slice()
    if (newId === _.get(indexes, [0, 'id'])) {
      indexes.shift()
    }
    indexes = [newIndex, ...indexes]
    return indexes
  }

  return state
}

const actionCreators = {
  indexesMerge: (newIndexes: BattleIndex[]) => ({
    type: '@poi-plugin-battle-detail@indexesMerge',
    newIndexes,
  }),
}

export { reducer, actionCreators }
