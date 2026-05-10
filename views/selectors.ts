import _ from 'lodash'
import { createSelector } from 'reselect'
import { extensionSelectorFactory, configSelector as poiConfSelector } from 'views/utils/selectors'
import { initState } from './store'
import type { ExtState } from './store/ext-root'
import type { UIState } from './store/ext-root/ui'

const extSelector = createSelector(
  extensionSelectorFactory('poi-plugin-battle-detail'),
  (ext: ExtState) => _.isEmpty(ext) ? initState : ext,
)

window.getExt = () => {
  const { getStore } = window
  return extSelector(getStore())
}

export const uiSelector = createSelector(extSelector, (ext: ExtState) => ext.ui)

export const indexesSelector = createSelector(extSelector, (ext: ExtState) => ext.indexes)

export const sortieIndexesSelector = createSelector(extSelector, (ext: ExtState) => ext.sortieIndexes)

export const modalSelector = createSelector(uiSelector, (ui: UIState) => ui.modal)

export const sortieViewerSelector = createSelector(uiSelector, (ui: UIState) => ui.sortieViewer)

export const browseModeSelector = createSelector(uiSelector, (ui: UIState) => ui.browseMode)

export const themeSelector = createSelector(
  poiConfSelector,
  (conf: Record<string, unknown>) => _.get(conf, 'poi.theme', 'paperdark'),
)
