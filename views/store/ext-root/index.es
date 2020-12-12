import { combineReducers, bindActionCreators } from 'redux'
import { store } from 'views/create-store'

import { reducer as ui, actionCreators as uiAC } from './ui'
import { reducer as indexes, actionCreators as indexesAC } from './indexes'
import { reducer as sortieIndexes, actionCreators as sortieIndexesAC } from './sortie-indexes'

/*
   this module and sub-modules mirror redux structure at runtime
 */

const reducer = combineReducers({
  indexes, ui, sortieIndexes,
})

const initState = reducer(undefined, {type: '@@INIT'})

/*
  TODO: instead of replacing the whole index array with a new one every time,
  we'll signal a redux action which can be received by both `indexes` and `sortieIndexes`.
  this way we can make sure both structure are kept in sync.
 */

const actionCreators = {
  notifyIndex: (newId, newIndex) => ({
    /*
      This action is supported in both `indexes` and `sortieIndexes` subreducer
      for notifying a (potentially) new index.
      This notified index should either be the latest battle index already,
      or a brand new one.

      While xxxxReplace actions are available, those should be avoided
      as they are only meant for initialization.

      TODO:
      - `sortieIndexes` subreducer support
     */
    type: '@poi-plugin-battle-detail@notifyIndex',
    newId, newIndex,
  }),
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
