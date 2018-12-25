import {
  unionSorted,
} from 'subtender'

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
