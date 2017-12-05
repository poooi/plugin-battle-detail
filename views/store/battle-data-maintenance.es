import _ from 'lodash'
import {
  modifyObject,
} from 'subtender'

import AppData from 'lib/appdata'
import { IndexCompat } from 'lib/compat'
import { sleep } from 'views/utils'
import { extendReducer } from 'views/create-store'
import { reducer, withBoundActionCreators } from './common'

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
      // TODO: tell observer init is done
      // rest of the code handles battles that haven't been indexed
      try {
        const diff = _.difference(
          await AppData.listBattle(),
          indexes.map(x => x.id),
        )
        if (diff.length > 0) {
          const newIndexes = await createIndex(diff)
          bac.indexesMerge(newIndexes)
          // TODO: saving mechanism
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
}
