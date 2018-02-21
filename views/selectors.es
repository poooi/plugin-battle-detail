import _ from 'lodash'
import { createSelector } from 'reselect'
import { mapIdToStr } from 'subtender/kc'
import {
  extensionSelectorFactory,
  fcdSelector,
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

const getMapNodeLetterFuncSelector = createSelector(
  fcdSelector,
  fcd => _.memoize(mapId => {
    const routeInfo = _.get(fcd, ['map', mapIdToStr(mapId), 'route'])
    if (_.isEmpty(routeInfo))
      return edgeId => String(edgeId)

    return edgeId => routeInfo[edgeId][1]
  })
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
  sortieViewerSelector,
  browseModeSelector,
  getMapNodeLetterFuncSelector,
  themeSelector,
}
