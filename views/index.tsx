import _ from 'lodash'
import { connect } from 'react-redux'
import { store } from 'views/create-store'
import { modifyObject } from 'subtender'
import React, { useEffect, useCallback, useRef } from 'react'
import { Tabs, Tab } from '@blueprintjs/core'
import { EventEmitter } from 'events'
import { join } from 'path-extra'

import ModalArea from './modal-area'
import OptionArea from './option-area'
import OverviewArea from './overview-area'
import DetailArea from './detail-area'
import BrowseArea from './browse-area'
import AppData from '../lib/appdata'
import PacketManager from '../lib/packetmanager'

import { Simulator } from '../lib/battle'
import { PacketCompat, IndexCompat } from '../lib/compat'
import { initData, actionCreators } from './store'
import { indexesSelector, uiSelector } from './selectors'
import { globalSubscribe, globalUnsubscribe } from './observers'
import { loadScript } from './utils'

const { ipc } = window
const { __ } = window.i18n['poi-plugin-battle-detail']

const pm = new PacketManager()
const em = new EventEmitter()

async function handlePacket(newBattle: any, _curPacket: any) {
  const newId = PacketCompat.getId(newBattle)
  AppData.saveBattle(newId, newBattle)
  const { showLast } = uiSelector(store.getState())
  const newIndex = IndexCompat.getIndex(newBattle, newId)
  store.dispatch(actionCreators.notifyIndex(newId, newIndex))
  if (showLast) {
    em.emit('dataupdate', newBattle)
  }
}

export function pluginDidLoad() {
  initData()
  globalSubscribe()
  pm.addListener('battle', handlePacket)
  pm.addListener('result', handlePacket)
}

export function pluginWillUnload() {
  pm.removeListener('battle', handlePacket)
  pm.removeListener('result', handlePacket)
  globalUnsubscribe()
}

interface MainAreaProps {
  activeTab: number
  disableBrowser: boolean
  battle: any
  indexes: any[]
  showLast: boolean
  uiModify: (modifier: any) => void
}

const MainAreaImpl: React.FC<MainAreaProps> = ({
  battle, activeTab, disableBrowser, indexes, uiModify,
}) => {
  const battleArea = useRef<HTMLDivElement>(null)
  const indexesRef = useRef(indexes)
  useEffect(() => { indexesRef.current = indexes }, [indexes])

  const updateBattle = useCallback(async (id: any) => {
    let resolved = id
    if (typeof id === 'number') {
      resolved = await AppData.loadBattle(id)
    }
    uiModify(_.flow(
      modifyObject('activeTab', () => 0),
      modifyObject('battle', () => resolved),
      modifyObject('showLast', () => true),
    ))
  }, [uiModify])

  const updateBattleRef = useRef(updateBattle)
  useEffect(() => { updateBattleRef.current = updateBattle }, [updateBattle])

  const showBattleWithTimestamp = useCallback(async (timestamp: any, callback?: (msg: string | null) => void) => {
    let message: string | null = null
    if (typeof timestamp !== 'number') {
      message = __('Unknown error')
    } else {
      const start = timestamp - 2000
      const end = timestamp + 2000
      const list: number[] = []
      for (const { id } of indexesRef.current) {
        if (id > end) continue
        if (id < start) break
        list.push(id)
      }
      if (list.length <= 0) {
        message = __('Battle not found')
      } else if (list.length >= 2) {
        message = __('Multiple battle found')
      } else {
        try {
          await updateBattleRef.current(list[0])
        } catch (err: any) {
          message = __('Unknown error')
          console.error(err.stack)
        }
      }
    }
    if (typeof callback === 'function') {
      callback(message)
    }
  }, [])

  const handleDataUpdate = useCallback((newBattle: any) => {
    uiModify(modifyObject('battle', () => newBattle))
  }, [uiModify])

  useEffect(() => {
    const startupState = ipc.access('BattleDetail')
    if (startupState && startupState.timestamp) {
      showBattleWithTimestamp(startupState.timestamp)
      ipc.unregister('BattleDetail', 'timestamp')
    }
    ipc.register('BattleDetail', { showBattleWithTimestamp })
    window.showBattleWithTimestamp = showBattleWithTimestamp
    em.addListener('dataupdate', handleDataUpdate)
    if (battleArea.current) {
      loadScript(require.resolve('dom-to-image'), battleArea.current.ownerDocument)
    }
    return () => {
      ipc.unregisterAll('BattleDetail')
      window.showBattleWithTimestamp = null
      em.removeListener('dataupdate', handleDataUpdate)
    }
  }, [showBattleWithTimestamp, handleDataUpdate])

  const handleSelectTab = useCallback((newTabId: any) => {
    uiModify(modifyObject('activeTab', () => newTabId))
  }, [uiModify])

  let simulator: any = {}
  let stages: any[] = []
  try {
    simulator = Simulator.auto(battle, { usePoiAPI: true }) || {}
    stages = simulator.stages || []
  } catch (err: any) {
    console.error(battle, err.stack)
  }

  return (
    <div id="battle-detail-main">
      <link rel="stylesheet" href={join(__dirname, 'assets', 'main.css')} />
      <ModalArea />
      <Tabs id="main-tabs" selectedTabId={activeTab} onChange={handleSelectTab}>
        <Tab
          id={0}
          title={__('Battle')}
          panel={
            <>
              <OptionArea
                battle={battle}
                updateBattle={updateBattle}
                battleArea={battleArea}
              />
              <div id="battle-area" ref={battleArea}>
                <OverviewArea simulator={simulator} stages={stages} />
                <DetailArea simulator={simulator} stages={stages} />
              </div>
            </>
          }
        />
        <Tab
          id={1}
          title={__('Browse')}
          disabled={disableBrowser}
          panel={
            <BrowseArea
              indexes={indexes}
              updateBattle={updateBattle}
            />
          }
        />
      </Tabs>
    </div>
  )
}

export { reducer } from './store'

export const reactClass = connect(
  (state: any) => {
    const { activeTab, disableBrowser, battle, showLast } = uiSelector(state)
    const indexes = indexesSelector(state)
    return { activeTab, disableBrowser, battle, indexes, showLast }
  },
  actionCreators
)(MainAreaImpl)
