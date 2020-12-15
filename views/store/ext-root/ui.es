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
