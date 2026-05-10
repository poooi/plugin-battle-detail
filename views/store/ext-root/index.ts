import { combineReducers, bindActionCreators } from 'redux'
import type { Dispatch } from 'redux'
import { store } from 'views/create-store'

import { reducer as ui, actionCreators as uiAC } from './ui'
import { reducer as indexes, actionCreators as indexesAC } from './indexes'
import { reducer as sortieIndexes, actionCreators as sortieIndexesAC } from './sortie-indexes'
import { groupBattleIndexes } from '../battle-groupper'
import type { BattleIndex } from './indexes'

const reducer = combineReducers({ indexes, ui, sortieIndexes })

export type ExtState = ReturnType<typeof reducer>

const initState = reducer(undefined, { type: '@@INIT' })

const actionCreators = {
  notifyIndex: (newId: number, newIndex: BattleIndex) => (dispatch: Dispatch, getState: () => RootState) => {
    const curStore = getState()
    dispatch({
      type: '@poi-plugin-battle-detail@notifyIndex',
      newId, newIndex, curStore,
    })
  },
  atomicReplaceIndexes: (indexes: BattleIndex[]) => (dispatch: Dispatch, getState: () => RootState) => {
    const curStore = getState()
    const sortieIndexes = groupBattleIndexes(curStore)(indexes)
    dispatch({
      type: '@poi-plugin-battle-detail@atomicReplaceIndexes',
      indexes, sortieIndexes,
    })
  },
  ...indexesAC,
  ...uiAC,
  ...sortieIndexesAC,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const boundActionCreators = bindActionCreators(actionCreators as any, store.dispatch)

export { reducer, initState, actionCreators, boundActionCreators }
