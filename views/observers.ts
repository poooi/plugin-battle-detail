import _ from 'lodash'
import { observe, observer } from 'redux-observers'
import { store } from 'views/create-store'
import { createSelector } from 'reselect'

import { indexesSelector } from './selectors'
import { isDataLoaded } from './store/data-maintenance'
import AppData from '../lib/appdata'

import type { BattleIndex } from './store/ext-root/indexes'

const indexesSaver = observer(
  createSelector(
    indexesSelector,
    (indexes: BattleIndex[]) => indexes[0],
  ),
  (_dispatch: unknown, cur: BattleIndex | undefined, prev: BattleIndex | undefined) => {
    if (!isDataLoaded()) return
    if (!_.isEqual(cur, prev)) {
      const indexes = indexesSelector(store.getState())
      AppData.saveIndex(indexes)
    }
  },
)

let unsubscribe: (() => void) | null = null

export const globalSubscribe = () => {
  if (unsubscribe !== null) {
    console.warn('expecting "unsubscribe" to be null')
    if (typeof unsubscribe === 'function') unsubscribe()
    unsubscribe = null
  }
  unsubscribe = observe(store, [indexesSaver])
}

export const globalUnsubscribe = () => {
  if (typeof unsubscribe !== 'function') {
    console.warn(`unsubscribe is not a function`)
  } else {
    unsubscribe()
    unsubscribe = null
  }
}
