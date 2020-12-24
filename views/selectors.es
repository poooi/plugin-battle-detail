import _ from 'lodash'
import { createSelector } from 'reselect'
import {
  extensionSelectorFactory,
  configSelector as poiConfSelector,
} from 'views/utils/selectors'

import { initState } from './store'

const extSelector = createSelector(
  extensionSelectorFactory('poi-plugin-battle-detail'),
  ext => _.isEmpty(ext) ? initState : ext)

window.getExt = () => {
  const {getStore} = window
  return extSelector(getStore())
}

const uiSelector = createSelector(
  extSelector,
  ext => ext.ui
)

const indexesSelector = createSelector(
  extSelector,
  ext => ext.indexes
)

const sortieIndexesSelector = createSelector(
  extSelector,
  ext => ext.sortieIndexes
)

const modalSelector = createSelector(
  uiSelector,
  ui => ui.modal
)

const sortieViewerSelector = createSelector(
  uiSelector,
  ui => ui.sortieViewer
)

const browseModeSelector = createSelector(
  uiSelector,
  ui => ui.browseMode
)

const themeSelector = createSelector(
  poiConfSelector,
  conf => _.get(conf, 'poi.theme', 'paperdark')
)

export {
  extSelector,
  uiSelector,
  modalSelector,
  indexesSelector,
  sortieIndexesSelector,
  sortieViewerSelector,
  browseModeSelector,
  themeSelector,
}
