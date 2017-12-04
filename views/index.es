import _ from 'lodash'
import { Provider } from 'react-redux'
import { store } from 'views/create-store'

import ModalArea, { showModal, hideModal } from './modal-area'
import OptionArea from './option-area'
import OverviewArea from './overview-area'
import DetailArea from './detail-area'
import BrowseArea from './browse-area'
import AppData from 'lib/appdata'
import PacketManager from 'lib/packetmanager'

import { Simulator } from 'lib/battle'
import { PacketCompat, IndexCompat } from 'lib/compat'
import { sleep } from 'views/utils'
import { init as storeInit } from './store'
const {React, ReactBootstrap, remote, ipc, __} = window

const {Tab, Tabs} = ReactBootstrap
const INDEXES_LOAD_INTERVAL = 500
const INDEXES_LOAD_NUMBER = 500

storeInit()

class MainArea extends React.Component {
  constructor() {
    super()
    this.state = {
      activeTab: 0,
      disableBrowser: false,
      battle: null,
      indexes: [],
      showLast: true,
    }
  }

  componentDidMount() {
    ipc.register("BattleDetail", {
      showBattleWithTimestamp: this.showBattleWithTimestamp,
    })
    this.pm = new PacketManager()
    this.pm.addListener('battle', this.handlePacket)
    this.pm.addListener('result', this.handlePacket)

    setTimeout(this.init, 100)
  }

  componentWillUnmount() {
    ipc.unregisterAll("BattleDetail")
    this.pm.removeListener('battle', this.handlePacket)
    this.pm.removeListener('result', this.handlePacket)
  }

  init = async () => {
    // Load index from disk
    let indexes = await AppData.loadIndex()
    for (let line of indexes) {
      line.id = parseInt(line.id)
    }
    await this.updateIndex(indexes)

    // Update index
    try {
      let diff = _.difference(
        await AppData.listBattle(),
        indexes.map((x) => x.id),
      )
      if (diff.length === 0) return
      const newIndex = await this.createIndex(diff)
      indexes = newIndex.concat(this.state.indexes || [])
      indexes.sort((x, y) => y.id - x.id)  // Sort from newer to older
      AppData.saveIndex(indexes)
      this.updateIndex(indexes)
    }
    catch (err) {
      console.error(err.stack)
      this.setState({
        disableBrowser: true,
      })
      showModal({
        title: __("Indexing"),
        body : [
          __("An error occurred while indexing battle on disk."),
          __("Battle browsor is disabled."),
          __("Please contact the developers."),
        ],
      })
    }
  }

  createIndex = async (list) => {
    let eta = new Date(Date.now() + list.length / INDEXES_LOAD_NUMBER * INDEXES_LOAD_INTERVAL)
    showModal({
      title: __("Indexing"),
      body : [
        __("Indexing battle from disk. Please wait..."),
        __("ETA:") + eta.toLocaleTimeString(),
      ],
      closable: false,
    })

    let indexes = []
    while (list.length > 0) {
      let _st = Date.now()
      console.log(`Indexing... ${list.length} remains at ${_st}.`)  // eslint-disable-line no-console
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
        })
      )
      await sleep(INDEXES_LOAD_INTERVAL + _st - Date.now())
    }

    hideModal()
    return indexes
  }

  handlePacket = async (newBattle, curPacket) => {
    // Save new battle immediately
    const newId = PacketCompat.getId(newBattle)
    AppData.saveBattle(newId, newBattle)

    let {battle, indexes, showLast} = this.state
    if (newId === (indexes[0] || {}).id) {
      indexes.shift()
    }
    indexes = [
      IndexCompat.getIndex(newBattle, newId),
      ...indexes,
    ]
    if (showLast) {
      battle = newBattle
    }
    this.setState({battle, indexes})
    AppData.saveIndex(indexes)
  }

  updateBattle = async (battle) => {
    if (typeof battle === 'number') {
      battle = await AppData.loadBattle(battle)
    }
    this.setState({
      activeTab: 0,
      battle   : battle,
      showLast : true,  // TODO: false
    })
  }

  updateIndex = async (indexes) => {
    let {battle, showLast} = this.state
    if (indexes == null) {
      indexes = []
    }
    if (showLast) {
      let last = indexes[0] || {}
      battle = await AppData.loadBattle(last.id)
    }
    this.setState({battle, indexes})
  }

  updateShowLast = (showLast) => {
    this.setState({
      showLast: showLast,
    })
  }

  onSelectTab = (key) => {
    this.setState({
      activeTab: key,
    })
  }

  render() {
    const {battle} = this.state
    let simulator = {}, stages = []
    try {
      simulator = Simulator.auto(battle, { usePoiAPI: true }) || {}
      stages = simulator.stages || []
    }
    catch (err) {
      console.error(battle, err.stack)
    }

    return (
      <Provider store={store}>
        <div id="main">
          <ModalArea />
          <Tabs id="main-tabs" activeKey={this.state.activeTab} onSelect={this.onSelectTab}>
            <Tab eventKey={0} title={__("Battle")}>
              <OptionArea
                battle={this.state.battle}
                updateBattle={this.updateBattle}
              />
              <div id="battle-area">
                <OverviewArea simulator={simulator} stages={stages} />
                <DetailArea simulator={simulator} stages={stages} />
              </div>
            </Tab>
            <Tab eventKey={1} title={__("Browse")} disabled={this.state.disableBrowser}>
              <BrowseArea
                indexes={this.state.indexes}
                updateBattle={this.updateBattle}
              />
            </Tab>
          </Tabs>
        </div>
      </Provider>
    )
  }

  showBattleWithTimestamp = async (timestamp, callback) => {
    let message = null
    do {  // eslint-disable-line no-constant-condition
      if (typeof timestamp != "number") {
        message = __("Unknown error")
        break
      }
      let start = timestamp - 2000
      let end = timestamp + 2000
      let list = []
      for (let {id} of this.state.indexes) {
        if (id > end)
          continue
        if (id < start)
          break
        list.push(id)
      }
      if (list == null) {
        message = __("Unknown error")
        break
      }
      if (list.length <= 0) {
        message = __("Battle not found")
        break
      }
      if (list.length >= 2) {
        message = __("Multiple battle found")
        break
      }
      try {
        let id = list[0]
        this.updateBattle(id)
        remote.getCurrentWindow().show()
      } catch (err) {
        message = __("Unknown error")
        console.error(err.stack)
      }
    } while (0)
    if (typeof callback === 'function') {
      callback(message)
    }
  }
}

export default MainArea
