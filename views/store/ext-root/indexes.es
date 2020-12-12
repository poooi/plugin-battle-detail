import _ from 'lodash'

import {
  unionSorted,
} from 'subtender'

/*
  indexes subreducer stores Array of metadata for each battle.

  items are sorted in decending order of time (which is the same as id)
  so that the newest item is always the first one.
 */

/*
   mergeIndexes(<Array of index>, <Array of index>) : <Array of index>

   - merges two Arrays of indexes together
   - both input Array must be sorted in descending order of "id" property
   - two input Array must not have any element in common
   - output Array preserves the descending order
 */
const mergeIndexes = unionSorted((x,y) => y.id - x.id)

const reducer = (state = [], action) => {
  if (action.type === '@poi-plugin-battle-detail@atomicReplaceIndexes') {
    const {indexes} = action
    return indexes
  }

  if (action.type === '@poi-plugin-battle-detail@indexesMerge') {
    const {newIndexes} = action
    return mergeIndexes(state, newIndexes)
  }

  if (action.type === '@poi-plugin-battle-detail@notifyIndex') {
    const {newId, newIndex} = action

    if (_.isEqual(state[0], newIndex)) {
      return state
    }

    let indexes = state.slice()
    if (newId === _.get(indexes, [0, 'id'])) {
      indexes.shift()
    }
    indexes = [
      newIndex,
      ...indexes,
    ]
    return indexes
  }
  return state
}

const actionCreators = {
  indexesMerge: newIndexes => ({
    type: '@poi-plugin-battle-detail@indexesMerge',
    newIndexes,
  }),
}

export { reducer, actionCreators }
