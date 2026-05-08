import { combineReducers, bindActionCreators } from 'redux'
import { store } from 'views/create-store'

import { reducer as ui, actionCreators as uiAC } from './ui'
import { reducer as indexes, actionCreators as indexesAC } from './indexes'
import { reducer as sortieIndexes, actionCreators as sortieIndexesAC } from './sortie-indexes'
import { groupBattleIndexes } from '../battle-groupper'

const reducer = combineReducers({ indexes, ui, sortieIndexes })

const initState = reducer(undefined as any, { type: '@@INIT' })

const actionCreators = {
  notifyIndex: (newId: number, newIndex: any) => (dispatch: any, getState: any) => {
    const curStore = getState()
    dispatch({
      type: '@poi-plugin-battle-detail@notifyIndex',
      newId, newIndex, curStore,
    })
  },
  atomicReplaceIndexes: (indexes: any[]) => (dispatch: any, getState: any) => {
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

const boundActionCreators = bindActionCreators(actionCreators as any, store.dispatch)

export { reducer, initState, actionCreators, boundActionCreators }
