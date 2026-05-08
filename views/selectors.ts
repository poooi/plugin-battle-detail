import _ from 'lodash'
import { createSelector } from 'reselect'
import { extensionSelectorFactory, configSelector as poiConfSelector } from 'views/utils/selectors'
import { initState } from './store'

const extSelector = createSelector(
  extensionSelectorFactory('poi-plugin-battle-detail'),
  (ext: any) => _.isEmpty(ext) ? initState : ext
)

;(window as any).getExt = () => {
  const { getStore } = window
  return extSelector(getStore())
}

export const uiSelector = createSelector(extSelector, (ext: any) => ext.ui)

export const indexesSelector = createSelector(extSelector, (ext: any) => ext.indexes)

export const sortieIndexesSelector = createSelector(extSelector, (ext: any) => ext.sortieIndexes)

export const modalSelector = createSelector(uiSelector, (ui: any) => ui.modal)

export const sortieViewerSelector = createSelector(uiSelector, (ui: any) => ui.sortieViewer)

export const browseModeSelector = createSelector(uiSelector, (ui: any) => ui.browseMode)

export const themeSelector = createSelector(
  poiConfSelector,
  (conf: any) => _.get(conf, 'poi.theme', 'paperdark')
)
