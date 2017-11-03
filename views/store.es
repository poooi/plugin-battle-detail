import _ from 'lodash'
import { bindActionCreators } from 'redux'

import AppData from 'lib/appdata'
import { IndexCompat } from 'lib/compat'
import { sleep } from 'views/utils'
import { store, extendReducer } from 'views/create-store'
import { modifyObject } from 'subtender'

const initState = {
  // INVARIANT: indexes must be sorted in descending order
  // of "id", which is an integer
  indexes: [],
  ui: {
    battle: null,
  },
}

const ACTION_TYPES = {
  indexesReplace: '@poi-plugin-battle-detail@indexesReplace',
}

const reducer = (state = initState, action) => {
  if (action.type === ACTION_TYPES.indexesReplace) {
    const {indexes} = action
    return modifyObject('indexes', () => indexes)(state)
  }

  return state
}

const actionCreators = {
  indexesReplace: indexes => ({
    type: ACTION_TYPES.indexesReplace,
    indexes,
  }),
}

const boundActionCreators =
  bindActionCreators(actionCreators, store.dispatch)

const withBoundActionCreators = func =>
  func(boundActionCreators)

const createIndex = async list => {
  const INDEXES_LOAD_INTERVAL = 500
  const INDEXES_LOAD_NUMBER = 500
  let indexes = []
  while (list.length > 0) {
    let _st = Date.now()
    // eslint-disable-next-line no-console
    console.log(`Indexing... ${list.length} remains at ${_st}.`)
    let ids = list.splice(0, INDEXES_LOAD_NUMBER)
    await Promise.all(
      ids.map(async (id) => {
        let battle
        try {
          battle = await AppData.loadBattle(id)
          if (battle != null)
            indexes.push(IndexCompat.getIndex(battle, id))
        }
        catch (err) {
          console.error(`Failed to index battle ${id}. Moving it to trash.`, '\n', err.stack)
          await AppData.trashBattle(id)
        }
      }
      ))
    await sleep(INDEXES_LOAD_INTERVAL + _st - Date.now())
  }
  return indexes
}

const init = () => {
  extendReducer('poi-plugin-battle-detail', reducer)
  setTimeout(() =>
    withBoundActionCreators(async bac => {
      const rawIndexes = await AppData.loadIndex()
      // making sure "id" is int
      const indexes = rawIndexes.map(modifyObject('id', Number))
      bac.indexesReplace(indexes)

      try {
        const diff = _.difference(
          await AppData.listBattle(),
          indexes.map(x => x.id),
        )
        if (diff.length > 0) {
          const newIndex = await createIndex(diff)
          // TODO can merge instead of sorting
          const newIndexes = newIndex.concat(this.state.indexes || [])
          newIndexes.sort((x, y) => y.id - x.id)  // Sort from newer to older
          AppData.saveIndex(newIndexes)
        }
      } catch (err) {
        console.error(err.stack)
        // TODO
      }
    })
  )
}

export {
  init,
  reducer,
  actionCreators,
  boundActionCreators,
  withBoundActionCreators,
}
