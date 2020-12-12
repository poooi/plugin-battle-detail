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
  if (action.type === '@poi-plugin-battle-detail@indexesReplace') {
    const {indexes} = action
    return indexes
  }

  if (action.type === '@poi-plugin-battle-detail@indexesMerge') {
    const {newIndexes} = action
    return mergeIndexes(state, newIndexes)
  }

  return state
}

const actionCreators = {
  /*
    TODO: we need a single action that both indexes and sortieIndexes can respond
    to ensure atomicity
   */
  indexesReplace: indexes => ({
    type: '@poi-plugin-battle-detail@indexesReplace',
    indexes,
  }),
  indexesMerge: newIndexes => ({
    type: '@poi-plugin-battle-detail@indexesMerge',
    newIndexes,
  }),
}

export { reducer, actionCreators }
