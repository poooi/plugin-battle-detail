/*
  This reducer groups battle indices into sortie indexes.

  TODO: for now this is not yet kept in sync with `indexes`.

  `indexes` subreducer will be authoritative - the idea is that one can always
  re-construct sortieIndexes in the event that this becomes inconsistent or
  when for whatever reason FCD is updated so that the current grouping is invalidated.
 */

const reducer = (state = null, action) => {
  if (action.type === '@poi-plugin-battle-detail@sortieIndexesModify') {
    const {modifier} = action
    return modifier(state)
  }
  return state
}

const actionCreators = {
  sortieIndexesModify: modifier => ({
    type: '@poi-plugin-battle-detail@sortieIndexesModify',
    modifier,
  }),
}

export { reducer, actionCreators }
