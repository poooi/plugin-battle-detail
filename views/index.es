"use strict"

import {sleep} from 'views/utils'

const AppData = require('../lib/appdata')
const PacketManager = require('../lib/packet-manager')
const ModalArea = require('./modal-area')
const OptionArea = require('./option-area')
const BattleArea = require('./battle-area')
const BrowseArea = require('./browse-area')

const {React, ReactBootstrap, remote, ipc, _, __} = window
const {Tab, Tabs} = ReactBootstrap
const MANIFEST_LOAD_INTERVAL = 1000
const MANIFEST_LOAD_NUMBER = 1000

class MainArea extends React.Component {
  constructor() {
    super()
    this.state = {
      activeTab: 0,
      battle: null,
      manifest: [],
      showLast: true,
    }
  }

  componentDidMount() {
    ipc.register("BattleDetail", {
      showBattleWithTimestamp: this.showBattleWithTimestamp,
    })
    PacketManager.addListener('packet', this.handlePacket)
    setTimeout(this.init, 1000)
  }

  componentWillUnmount() {
    ipc.unregisterAll("BattleDetail")
    PacketManager.removeListener('packet', this.handlePacket)
  }

  init = async () => {
    // Load manifest from disk
    let manifest = await AppData.loadManifest() || []
    for (let line of manifest) {
      line.id = parseInt(line.id)
    }
    await this.updateManifest(manifest)

    // Should update manifest?
    let diff = _.difference(
      await AppData.listBattle(),
      manifest.map((x) => x.id),
    )
    if (diff.length === 0) {
      return
    }

    // Update notification
    let eta = new Date(Date.now() + diff.length / MANIFEST_LOAD_NUMBER * MANIFEST_LOAD_INTERVAL)
    window.showModal({
      title: "Indexing",
      body : `Indexing battle. ETA: ${eta.toLocaleTimeString()}`,
      closable: false,
    })

    // Update manifest
    manifest = [...manifest]  // Make a copy
    while (diff.length > 0) {
      let _st = Date.now()
      let ids = diff.splice(0, MANIFEST_LOAD_NUMBER)
      await Promise.all(
        ids.map(async (id) => {
          let packet = await AppData.loadBattle(id)
          if (packet != null) {
            manifest.push({
              id  : id,
              time: PacketManager.getTime(packet),
              map : PacketManager.getMap(packet),
              desc: packet.desc,
            })
          }
        }
      ))
      await sleep(MANIFEST_LOAD_INTERVAL + _st - Date.now())
    }
    manifest.sort((x, y) => y.id - x.id)  // Sort from newer to older
    AppData.saveManifest(manifest)
    await this.updateManifest(manifest)

    // Update notification
    window.hideModal()
  }

  handlePacket = async (newId, newBattle) => {
    // Save new battle immediately
    AppData.saveBattle(newId, newBattle)

    let {battle, manifest, showLast} = this.state
    if (newId === (manifest[0] || {}).id) {
      manifest.shift()
    }
    manifest = [
      {
        id:   newId,
        time: PacketManager.getTime(newBattle),
        map:  PacketManager.getMap(newBattle),
        desc: newBattle.desc,
      },
      ...manifest,
    ]
    if (showLast) {
      battle = newBattle
    }
    this.setState({battle, manifest})
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

  updateManifest = async (manifest) => {
    let {battle, showLast} = this.state
    if (manifest == null) {
      manifest = []
    }
    if (showLast) {
      let last = manifest[0] || {}
      battle = await AppData.loadBattle(last.id)
    }
    this.setState({battle, manifest})
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
          <Tab eventKey={1} title={__("Browse")}>
            <BrowseArea
              manifest={this.state.manifest}
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
      for (let {id} of this.state.manifest) {
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
        let packet = await AppData.loadBattle(list[0])
        remote.getCurrentWindow().show()
        this.updateBattle(packet)
      } catch (err) {
        message = __("Unknown error")
        console.error(err)
      }
    } while (0)
    if (typeof callback === 'function') {
      callback(message)
    }
  }
}

export default MainArea
