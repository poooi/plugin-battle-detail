"use strict"

import {sleep} from 'views/utils'

const _ = require('lodash')
const AppData = require('../lib/appdata')
const PacketManager = require('../lib/packet-manager')
const ModalArea = require('./modal-area')
const OptionArea = require('./option-area')
const BattleArea = require('./battle-area')

const {React, remote, ipc, __} = window
const MANIFEST_LOAD_INTERVAL = 100
const MANIFEST_LOAD_NUMBER = 10

class MainArea extends React.Component {
  constructor() {
    super()
    this.state = {
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
    let manifest = await AppData.loadManifest() || []
    for (let line of manifest) {
      line.id = parseInt(line.id)
    }
    this.setState({manifest})

    let mlist = manifest.map((x) => x.id)
    let flist = await AppData.listBattle()
    let list = _.difference(flist, mlist)
    while (list.length > 0) {
      let ids = list.splice(0, MANIFEST_LOAD_NUMBER)
      await Promise.all(
        ids.map(async (id) => {
          let packet = await AppData.loadBattle(id)
          if (packet != null) {
            manifest = [
              {
                id  : id,
                time: PacketManager.getTime(packet),
                map : PacketManager.getMap(packet),
                desc: PacketManager.getDesc(packet),
              },
              ...manifest,
            ]
          }
        }
      ))
      await sleep(MANIFEST_LOAD_INTERVAL)
    }
    manifest.sort((x, y) => y.id - x.id)  // Sort from newer to older
    AppData.saveManifest(manifest)
    this.setState({manifest})
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
        desc: PacketManager.getDesc(newBattle),
      },
      ...manifest,
    ]
    if (showLast) {
      battle = newBattle
    }
    this.setState({battle, manifest})
  }

  // API for IPC
  showBattleWithTimestamp = async (timestamp, callback) => {
    let message = null
    while (0) {  // eslint-disable-line no-constant-condition
      if (typeof timestamp != "number") {
        message = __("Unknown error")
        break
      }
      let start = timestamp - 2000
      let end = timestamp + 2000
      let list = []
      for (let {id} of this.state.manifest) {
        if (id < start)
          continue
        if (id > end)
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
    }
    if (callback instanceof Function) {
      callback(message)
    }
  }

  updateBattle = (battle) => {
    this.setState({
      battle  : battle,
      showLast: false,
    })
  }

  updateShowLast = (showLast) => {
    this.setState({
      battle  : null,
      showLast: false,
    })
  }

  render() {
    return (
      <div id="main">
        <ModalArea />
        <OptionArea
          battle={this.state.battle}
          updateBattle={this.updateBattle}
          updateShowLast={this.updateShowLast}
          />
        <BattleArea
          battle={this.state.battle}
          />
      </div>
    )
  }
}

export default MainArea
