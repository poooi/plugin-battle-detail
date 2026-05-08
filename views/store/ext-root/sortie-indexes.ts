import { List } from 'immutable'
import { insertIndex } from '../battle-groupper'

export interface SortieIndex {
  effMapId: string
  indexes: any[]
}

const initState: List<SortieIndex> = List()

const reducer = (state: List<SortieIndex> = initState, action: any): List<SortieIndex> => {
  if (action.type === '@poi-plugin-battle-detail@atomicReplaceIndexes') {
    return action.sortieIndexes
  }

  if (action.type === '@poi-plugin-battle-detail@sortieIndexesModify') {
    return action.modifier(state)
  }

  if (action.type === '@poi-plugin-battle-detail@notifyIndex') {
    const { newId, newIndex, curStore } = action
    return insertIndex(curStore)(state, newId, newIndex)
  }

  return state
}

const actionCreators = {
  sortieIndexesModify: (modifier: (state: List<SortieIndex>) => List<SortieIndex>) => ({
    type: '@poi-plugin-battle-detail@sortieIndexesModify',
    modifier,
  }),
}

export { reducer, actionCreators }
