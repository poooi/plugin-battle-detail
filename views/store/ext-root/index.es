import { combineReducers, bindActionCreators } from 'redux'
import { store } from 'views/create-store'

import { reducer as ui, actionCreators as uiAC } from './ui'
import { reducer as indexes, actionCreators as indexesAC } from './indexes'
import { reducer as sortieIndexes, actionCreators as sortieIndexesAC } from './sortie-indexes'
import { groupBattleIndexes } from '../battle-groupper'
/*
   this module and sub-modules mirror redux structure at runtime
 */

const reducer = combineReducers({
  indexes, ui, sortieIndexes,
})

const initState = reducer(undefined, {type: '@@INIT'})

const actionCreators = {
  notifyIndex: (newId, newIndex) => (dispatch, getState) => {
    /*
      This action is supported in both `indexes` and `sortieIndexes` subreducer
      for notifying a (potentially) new index.
      This notified index should either be the latest battle index already,
      or a brand new one.

      While atomicReplaceIndexes action is available, those should be avoided
      as it is only meant for initialization.

      We are relying on redux-thunk to get access to the full store,
      as we need FCD for sortieIndexes to work.
     */
    const curStore = getState()
    dispatch({
      type: '@poi-plugin-battle-detail@notifyIndex',
      newId, newIndex, curStore,
    })
  },
  atomicReplaceIndexes: indexes => (dispatch, getState) => {
    /*
       this function builds up sortieIndexes as indexes are loaded,
       and distributes resulting indexes & sortieIndexes to subreducers.
     */
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

const boundActionCreators =
  bindActionCreators(actionCreators, store.dispatch)

export {
  reducer,
  initState,
  actionCreators,
  boundActionCreators,
}
