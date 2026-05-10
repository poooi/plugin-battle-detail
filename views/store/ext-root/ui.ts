import type React from 'react'
import type { Battle } from 'poi-lib-battle'

export interface ModalState {
  isShow: boolean
  title: React.ReactNode
  body: React.ReactNode
  footer: React.ReactNode
  closable: boolean
}

export interface SortieViewerState {
  viewingMapId: string
  activePage: number
  sortBy: {
    method: 'recent' | 'numeric'
    reversed: boolean
  }
}

export interface UIState {
  battle: Battle | null
  activeTab: number
  disableBrowser: boolean
  showLast: boolean
  browseMode: 'nodes' | 'sorties'
  sortieViewer: SortieViewerState
  modal: ModalState
}

const initState: UIState = {
  battle: null,
  activeTab: 0,
  disableBrowser: false,
  showLast: true,
  browseMode: 'nodes',
  sortieViewer: {
    viewingMapId: 'all',
    activePage: 1,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reducer = (state: UIState = initState, action: any): UIState => {
  if (action.type === '@poi-plugin-battle-detail@uiModify') {
    const { modifier } = action
    return modifier(state)
  }
  return state
}

const actionCreators = {
  uiModify: (modifier: (state: UIState) => UIState) => ({
    type: '@poi-plugin-battle-detail@uiModify',
    modifier,
  }),
}

export { initState, reducer, actionCreators }
