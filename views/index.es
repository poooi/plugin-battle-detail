import {sleep} from 'views/utils'

import ModalArea from './modal-area'
import OptionArea from './option-area'
import BattleArea from './battle-area'
import BrowseArea from './browse-area'
import AppData from 'lib/appdata'
import { PacketCompat } from 'lib/compat'
import { PacketManager } from 'lib/battle'

const {React, ReactBootstrap, remote, ipc, _, __} = window
const {Tab, Tabs} = ReactBootstrap
const MANIFEST_LOAD_INTERVAL = 1000
const MANIFEST_LOAD_NUMBER = 500

class MainArea extends React.Component {
  constructor() {
    super()
    this.state = {
      activeTab: 0,
      battle: null,
      indexes: [],
      showLast: true,
      disableBrowser: false,
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
      if (diff.length === 0) {
        return
      }
      let newIndex = await this.createIndex(diff)
      indexes = newIndex.concat(this.state.indexes || [])
      indexes.sort((x, y) => y.id - x.id)  // Sort from newer to older
      AppData.saveIndex(indexes)
      this.updateIndex(indexes)
    }
    catch (err) {
      this.setState({
        disableBrowser: true,
      })
      window.showModal({
        title: __("Indexing"),
        body : [__("An error occurred while indexing battle on disk."),
                __("Battle browsor is disabled."),
                __("Please contact the developers.")],
      })
      console.error(err.stack)
    }
  }

  createIndex = async (list) => {
    let eta = new Date(Date.now() + list.length / MANIFEST_LOAD_NUMBER * MANIFEST_LOAD_INTERVAL)
    window.showModal({
      title: __("Indexing"),
      body : [__("Indexing battle from disk. Please wait..."),
              __("ETA:") + eta.toLocaleTimeString()],
      closable: false,
    })

    let indexes = []
    while (list.length > 0) {
      let _st = Date.now()
      console.log(`Indexing... ${list.length} remains at ${_st}.`)  // eslint-disable-line no-console
      let ids = list.splice(0, MANIFEST_LOAD_NUMBER)
      await Promise.all(
        ids.map(async (id) => {
          let battle = await AppData.loadBattle(id)
          if (battle != null) {
            indexes.push({
              id  : id,
              time: PacketCompat.getTime(battle),
              map : PacketCompat.getMap(battle),
              desc: PacketCompat.getDesc(battle),
            })
          }
        }
      ))
      await sleep(MANIFEST_LOAD_INTERVAL + _st - Date.now())
    }

    window.hideModal()
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
      {
        id:   newId,
        time: PacketCompat.getTime(newBattle),
        map:  PacketCompat.getMap(newBattle),
        desc: PacketCompat.getDesc(newBattle),
      },
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
    return (
      <div id="main">
        <ModalArea />
        <Tabs id="main-tabs" activeKey={this.state.activeTab} onSelect={this.onSelectTab}>
          <Tab eventKey={0} title={__("Battle")}>
            <OptionArea
              battle={this.state.battle}
              updateBattle={this.updateBattle}
              />
            <BattleArea
              battle={this.state.battle}
              />
          </Tab>
          <Tab eventKey={1} title={__("Browse")} disabled={this.state.disableBrowser}>
            <BrowseArea
              indexes={this.state.indexes}
              updateBattle={this.updateBattle}
              />
          </Tab>
        </Tabs>
      </div>
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
