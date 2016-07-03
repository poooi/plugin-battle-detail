"use strict"

const fs = require('fs-extra')
const glob = require('glob')
const path = require('path-extra')
const zlib = require('zlib')
const {promisify} = require('bluebird')
const PacketManager = require('./packet-manager')

const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)
const globAsync = promisify(glob)
const gzipAsync = promisify(zlib.gzip)
const unzipAsync = promisify(zlib.unzip)

const APPDATA = path.join(window.APPDATA_PATH, 'battle-detail')
const REFRESH_INTERVAL = 60000
fs.ensureDir(APPDATA, (err) => {
  if (err) console.error(err)
})  

class AppData {
  constructor() {
    // List of battle's id saved in APPDATA. Sort from oldest to newest
    this.battleList = []
    this.battleListLastRefresh = 0
    this.battleFile = {}
  }

  async saveFile(name, data) {
    if (! (name && data))
      return
    try {
      let fpath = path.join(APPDATA, name)
      await writeFileAsync(fpath, data)
    }
    catch (err) {
      console.error(err)
    }
  }

  async loadFile(name) {
    if (! (name))
      return
    try {
      let fpath = path.join(APPDATA, name)
      let data = await readFileAsync(fpath)
      return data
    }
    catch (err) {
      console.error(err)
    }
  }

  async saveBattle(id, packet) {
    if (! (id && packet))
      return
    try {
      let name = `${id}.json.gz`
      let data = await gzipAsync(JSON.stringify(packet))
      await this.saveFile(name, data)

      if (! this.battleList.includes(id)) {
        this.battleList.push(id)
        this.battleList.sort()
      }
      this.battleFile[id] = {
        name: name,
        packet: packet,
      }
    }
    catch (err) {
      console.error(err)
    }
  }

  async loadBattle(id) {
    if (id == null)
      return null
    try {
      let file = this.battleFile[id]
      if (file == null)
        return null
      if (file.packet != null)
        return file.packet

      let data = await this.loadFile(file.name)
      if (path.parse(file.name).ext == '.gz') {
        data = await unzipAsync(data)
        data = data.toString()
      }
      let packet = JSON.parse(data)

      // Convert packet on load for compatibility.
      packet = PacketManager.convertV1toV2(packet)

      file.packet = packet
      return packet
    }
    catch (err) {
      console.error(err)
      return null
    }
  }

  async listBattle() {
    if (this.battleList.length <= 0){
      await this._refreshBattle()
    } else {
      this._refreshBattle()
    }
    return this.battleList
  }

  async _refreshBattle() {
    if ((Date.now() - this.battleListLastRefresh) < REFRESH_INTERVAL) {
      return
    }
    try {
      let list = []
      list = list.concat(await globAsync(path.join(APPDATA, "*.json")))
      list = list.concat(await globAsync(path.join(APPDATA, "*.json.gz")))
      list = list.map((p) => {
        let pp = path.parse(p)
        let name = pp.base
        let id = parseInt(name.slice(0, name.indexOf('.')))
        if (! this.battleFile[id]) {
          this.battleFile[id] = {
            name: name,
            packet: null,
          }
        }
        return id
      })
      list.sort()
      this.battleList = list
      this.battleListLastRefresh = Date.now()
    }
    catch (err) {
      console.error(err)
    }
  }

  async searchBattle(start, end) {
    if (! (start != null && end != null && start <= end)) {
      return
    }
    this._refreshBattle()
    let list = []
    for (let id of this.battleList) {
      if (id < start)
        continue
      if (id > end)
        break
      list.push(id)
    }
    return list
  }
}

export default new AppData()
