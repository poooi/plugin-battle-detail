import { List } from 'immutable'

const initState = List()

/*
  This reducer groups battle indices into sortie indexes.

  type annotation for the state would be:

  sortieIndexes: List<SortieIndex>
  type SortieIndex = {
    effMapId: string,
    indexes: Array<BattleIndex>
  }

  and holds the following invariants:

  - `indexes` of SortieIndex is always non-empty.
  - `sortieIndexes` are sorted by time of the first element of
    `indexes`, in descending order (so that the first one is the latest)
    (however since we know there is no overlap between sorties,
    any of those indices will work equally fine.
  - `indexes` are sorted by time but in ascending order,
    as it makes sense for a single sortie to be organized in this manner.

  TODO: for now this is not yet kept in sync with `indexes`.

  `indexes` subreducer will be authoritative - the idea is that one can always
  re-construct sortieIndexes in the event that this becomes inconsistent or
  when for whatever reason FCD is updated so that the current grouping is invalidated.
 */

const reducer = (state = initState, action) => {
  if (action.type === '@poi-plugin-battle-detail@sortieIndexesModify') {
    const {modifier} = action
    return modifier(state)
  }

  if (action.type === '@poi-plugin-battle-detail@sortieIndexesReplace') {
    const {newState} = action
    return newState
  }

  if (action.type ===  '@poi-plugin-battle-detail@notifyIndex') {
    // TODO:  `sortieIndexes` subreducer support
    return state
  }

  return state
}

const actionCreators = {
  sortieIndexesModify: modifier => ({
    type: '@poi-plugin-battle-detail@sortieIndexesModify',
    modifier,
  }),
  sortieIndexesReplace: newState => ({
    type: '@poi-plugin-battle-detail@sortieIndexesReplace',
    newState,
  }),
}

export { reducer, actionCreators }
