import { combineReducers, bindActionCreators } from 'redux'
import { store } from 'views/create-store'

import { reducer as ui, actionCreators as uiAC } from './ui'
import { reducer as indexes, actionCreators as indexesAC } from './indexes'
import { reducer as nestedIndexes, actionCreators as nestedIndexesAC } from './nested-indexes'

/*
   this module and sub-modules mirror redux structure at runtime
 */

const reducer = combineReducers({
  indexes, ui, nestedIndexes,
})

const initState = reducer(undefined, {type: '@@INIT'})

const actionCreators = {
  ...indexesAC,
  ...uiAC,
  ...nestedIndexesAC,
}

const boundActionCreators =
  bindActionCreators(actionCreators, store.dispatch)

export {
  reducer,
  initState,
  actionCreators,
  boundActionCreators,
}
