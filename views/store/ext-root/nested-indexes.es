import { Map } from 'immutable'

/*
  Stores indexes nested by map id.

  TOOD: the structure is an immutable Map, keyed by string (effecitive map id),
  and values are immutable Lists (or Array, TBD) that stores sorties
  this updates along with every index update to keep both structure in sync.

  Note: sorties are arrays of battles groupped together by List (or Array)

  indexes subreducer will be authoritative - the idea is that one can always
  re-construct nested-indexes in the event that this becomes inconsistent or
  when for whatever reason FCD is updated so that grouping needs some rework.
 */

const reducer = (state = Map(), action) => {
  if (action.type === '@poi-plugin-battle-detail@nestedIndexesModify') {
    const {modifier} = action
    return modifier(state)
  }
  return state
}

const actionCreators = {
  nestedIndexesModify: modifier => ({
    type: '@poi-plugin-battle-detail@nestedIndexesModify',
    modifier,
  }),
}

export { reducer, actionCreators }
