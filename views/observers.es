import _ from 'lodash'
import { observe, observer } from 'redux-observers'
import { store } from 'views/create-store'
import { createSelector } from 'reselect'

import { indexesSelector } from './selectors'
import { isDataLoaded } from './store/data-maintenance'
import AppData from '../lib/appdata'

const indexesSaver = observer(
  /*
    observing first element of indexes is sufficient to detect changes,
    as new index is always inserted in front, one at a time.
   */
  createSelector(
    indexesSelector,
    indexes => indexes[0]
  ),
  (_dispatch, cur, prev) => {
    if (!isDataLoaded()) {
      return
    }
    if (!_.isEqual(cur, prev)) {
      const indexes = indexesSelector(store.getState())
      AppData.saveIndex(indexes)
    }
  }
)

let unsubscribe = null

const globalSubscribe = () => {
  if (unsubscribe !== null) {
    console.warn('expecting "unsubscribe" to be null')
    if (typeof unsubscribe === 'function')
      unsubscribe()
    unsubscribe = null
  }

  unsubscribe = observe(store, [indexesSaver])
}

const globalUnsubscribe = () => {
  if (typeof unsubscribe !== 'function') {
    console.warn(`unsubscribe is not a function`)
  } else {
    unsubscribe()
    unsubscribe = null
  }
}

export {
  globalSubscribe,
  globalUnsubscribe,
}
