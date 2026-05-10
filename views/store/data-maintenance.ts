import _ from 'lodash'
import { modifyObject } from 'subtender'

import AppData from '../../lib/appdata'
import { IndexCompat } from '../../lib/compat'
import { sleep } from '../utils'
import { showModal, hideModal } from '../modal-area'
import { indexesSelector, uiSelector } from '../selectors'
import { boundActionCreators } from './ext-root'
import type { BattleIndex } from './ext-root/indexes'

const { getStore } = window
const { __ } = window.i18n['poi-plugin-battle-detail']

const INDEXES_LOAD_INTERVAL = 500
const INDEXES_LOAD_NUMBER = 500

let dataLoaded = false

export const isDataLoaded = () => dataLoaded

const createIndex = async (list: number[]): Promise<BattleIndex[]> => {
  const eta = new Date(Date.now() + list.length / INDEXES_LOAD_NUMBER * INDEXES_LOAD_INTERVAL)
  showModal({
    title: __('Indexing'),
    body: [
      __('Indexing battle from disk. Please wait...'),
      __('ETA:') + eta.toLocaleTimeString(),
    ],
    closable: false,
  })

  const indexes: BattleIndex[] = []
  while (list.length > 0) {
    const _st = Date.now()
    console.warn(`Indexing... ${list.length} remains at ${_st}.`)
    const ids = list.splice(0, INDEXES_LOAD_NUMBER)
    await Promise.all(
      ids.map(async (id) => {
        let battle
        try {
          battle = await AppData.loadBattle(id)
          if (battle != null)
            indexes.push(IndexCompat.getIndex(battle, id))
        } catch (err: unknown) {
          console.error(`Failed to index battle ${id}. Moving it to trash.`, '\n', (err as Error).stack)
          await AppData.trashBattle(id)
        }
      }),
    )
    await sleep(INDEXES_LOAD_INTERVAL + _st - Date.now())
  }

  hideModal()
  return indexes
}

const updateIndex = async (indexes: BattleIndex[]) => {
  const store = getStore()
  let { battle, showLast } = uiSelector(store)
  if (indexes == null) indexes = []
  if (showLast) {
    const last = indexes[0]
    battle = await AppData.loadBattle(last?.id)
  }
  boundActionCreators.uiModify(modifyObject('battle', () => battle))
  boundActionCreators.atomicReplaceIndexes(indexes)
}

export const initData = async () => {
  let indexes = await AppData.loadIndex()
  for (const line of indexes) {
    line.id = parseInt(line.id)
  }
  await updateIndex(indexes)

  try {
    const diff = _.difference(
      await AppData.listBattle(),
      indexes.map((x) => x.id),
    )
    if (diff.length === 0) {
      dataLoaded = true
      return
    }
    const newIndex = await createIndex(diff)
    const currentIndexes = indexesSelector(getStore())
    indexes = newIndex.concat(currentIndexes || [])
    indexes.sort((x, y) => y.id - x.id)
    AppData.saveIndex(indexes)
    updateIndex(indexes)
  } catch (err: unknown) {
    console.error((err as Error).stack)
    boundActionCreators.uiModify(modifyObject('disableBrowser', () => true))
    showModal({
      title: __('Indexing'),
      body: [
        __('An error occurred while indexing battle on disk.'),
        __('Battle browsor is disabled.'),
        __('Please contact the developers.'),
      ],
    })
  }
  dataLoaded = true
}
