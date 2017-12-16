import { bindActionCreators } from 'redux'
import {
  modifyObject,
  unionSorted,
} from 'subtender'

import { store } from 'views/create-store'

const initState = {
  // INVARIANT: indexes must be sorted in descending order
  // of "id", which is an integer
  indexes: [],
  ui: {
    battle: null,
    activeTab: 0,
    disableBrowser: false,
    showLast: true,

    // valid values: 'nodes' / 'sorties'
    browseMode: 'nodes',
    sortieViewer: {
      mapId: 'all',
      activePage: 1,
      sortBy: {
        // valid values: 'recent' / 'numeric'
        method: 'recent',
        reversed: false,
      },
    },

    modal: {
      isShow: false,
      title: null,
      body: null,
      footer: null,
      closable: false,
    },
  },
}

const ACTION_TYPES = {
  indexesReplace: '@poi-plugin-battle-detail@indexesReplace',
  indexesMerge: '@poi-plugin-battle-detail@indexesMerge',
  uiModify: '@poi-plugin-battle-detail@uiModify',
}

/*
   mergeIndexes(<Array of index>, <Array of index>) : <Array of index>

   - merges two Arrays of indexes together
   - both input Array must be sorted in descending order of "id" property
   - two input Array must not have any element in common
   - output Array preserves the descending order
 */
const mergeIndexes = unionSorted((x,y) => y.id - x.id)

const reducer = (state = initState, action) => {
  if (action.type === ACTION_TYPES.indexesReplace) {
    const {indexes} = action
    return modifyObject('indexes', () => indexes)(state)
  }

  if (action.type === ACTION_TYPES.indexesMerge) {
    const {newIndexes} = action
    return modifyObject(
      'indexes',
      indexes => mergeIndexes(indexes, newIndexes),
    )(state)
  }

  if (action.type === ACTION_TYPES.uiModify) {
    const {modifier} = action
    return modifyObject('ui', modifier)(state)
  }

  return state
}

const actionCreators = {
  indexesReplace: indexes => ({
    type: ACTION_TYPES.indexesReplace,
    indexes,
  }),
  indexesMerge: newIndexes => ({
    type: ACTION_TYPES.indexesMerge,
    newIndexes,
  }),
  uiModify: modifier => ({
    type: ACTION_TYPES.uiModify,
    modifier,
  }),
}

const boundActionCreators =
  bindActionCreators(actionCreators, store.dispatch)

const withBoundActionCreators = func =>
  func(boundActionCreators)

export {
  initState,
  reducer,
  actionCreators,
  boundActionCreators,
  withBoundActionCreators,
}
