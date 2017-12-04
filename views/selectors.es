import _ from 'lodash'
import { createSelector } from 'reselect'

import {
  extensionSelectorFactory,
} from 'views/utils/selectors'

import { initState } from './store'

const extSelector = createSelector(
  extensionSelectorFactory('poi-plugin-battle-detail'),
  ext => _.isEmpty(ext) ? initState : ext)

const uiSelector = createSelector(
  extSelector,
  ext => ext.ui
)

const modalSelector = createSelector(
  uiSelector,
  ui => ui.modal
)

export {
  extSelector,
  uiSelector,
  modalSelector,
}
