const initState = {
  battle: null,
  activeTab: 0,
  disableBrowser: false,
  showLast: true,

  // valid values: 'nodes' / 'sorties'
  browseMode: 'nodes',
  sortieViewer: {
    /*
      Indicates the effMapId user is viewing.

      This is either a EffMapId or string literal 'all'
     */
    viewingMapId: 'all',
    activePage: 1,
    /*
      Sorties are groupped (or filtered) by map ids.
      This part dictates how are those map ids sorted.

      `method` must be one of:
      - 'recent': put most recently sortied map first
      - 'numeric': sort map ids by world and area
        (as this is simply accomplished by sorting map ids numerically).
        (TODO: thing might complicate a bit here as phase are now introduced)

      `reversed`: a Boolean indicated whether to reverse sorted result.
     */
    sortBy: {
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
}

const reducer = (state = initState, action) => {
  if (action.type === '@poi-plugin-battle-detail@uiModify') {
    const {modifier} = action
    return modifier(state)
  }

  return state
}

const actionCreators = {
  uiModify: modifier => ({
    type: '@poi-plugin-battle-detail@uiModify',
    modifier,
  }),
}

export { reducer, actionCreators }
