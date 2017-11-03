import _ from 'lodash'
import { bindActionCreators } from 'redux'

import AppData from 'lib/appdata'
import { store, extendReducer } from 'views/create-store'
import { modifyObject } from 'subtender'

const initState = {
  // INVARIANT: indexes must be sorted in descending order
  // of "id", which is an integer
  indexes: [],
  ui: {
    battle: null,
  },
}

const ACTION_TYPES = {
  indexesReplace: '@poi-plugin-battle-detail@indexesReplace',
}

const reducer = (state = initState, action) => {
  if (action.type === ACTION_TYPES.indexesReplace) {
    const {indexes} = action
    return modifyObject('indexes', () => indexes)(state)
  }

  return state
}

const actionCreators = {
  indexesReplace: indexes => ({
    type: ACTION_TYPES.indexesReplace,
    indexes,
  }),
}

const boundActionCreators =
  bindActionCreators(actionCreators, store.dispatch)

const withBoundActionCreators = func =>
  func(boundActionCreators)

const init = () => {
  extendReducer('poi-plugin-battle-detail', reducer)
  setTimeout(() =>
    withBoundActionCreators(async bac => {
      const rawIndexes = await AppData.loadIndex()
      // making sure "id" is int
      const indexes = rawIndexes.map(modifyObject('id', Number))
      bac.indexesReplace(indexes)
    })
  )
}

export {
  init,
  reducer,
  actionCreators,
  boundActionCreators,
  withBoundActionCreators,
}
