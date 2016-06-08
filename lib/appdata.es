"use strict"

const fs = require('fs-extra')
const glob = require('glob')
const path = require('path-extra')
const zlib = require('zlib')
const {promisify} = require('bluebird')

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
    // List of packet saved in APPDATA
    // Use timestamp as id, Sort from oldest to newest
    this.packetList = []
    this.packetFile = {}
    this.packetListLastRefresh = 0
  }

  async listPacket() {
    if (this.packetList.length <= 0){
      await this._refreshPacket()
    } else {
      this._refreshPacket()
    }
    return this.packetList
  }

  async _refreshPacket() {
    if ((Date.now() - this.packetListLastRefresh) < REFRESH_INTERVAL) {
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
        if (! this.packetFile[id]) {
          this.packetFile[id] = {
            name: name,
            packet: null,
          }
        }
        return id
      })
      list.sort()
      this.packetList = list
      this.packetListLastRefresh = Date.now()
    }
    catch (err) {
      console.error(err)
    }
  }

  async savePacket(id, packet) {
    if (! (id && packet))
      return
    try {
      let name = `${id}.json.gz`
      let fpath = path.join(APPDATA, name)
      let data = await gzipAsync(JSON.stringify(packet))
      await writeFileAsync(fpath, data)

      this.packetList.push(id)
      this.packetFile[id] = {
        name: name,
        packet: packet,
      }
    }
    catch (err) {
      console.error(err)
    }
  }

  async loadPacket(id) {
    if (id == null) {
      return null
    }
    try {
      let file = this.packetFile[id]
      if (file == null) {
        return null
      }
      if (file.packet != null) {
        return file.packet
      }

      let fpath = path.join(APPDATA, file.name)
      let data = await readFileAsync(fpath)
      if (path.parse(file.name).ext == '.gz') {
        data = await unzipAsync(data)
        data = data.toString()
      }
      let packet = JSON.parse(data)
      file.packet = packet
      return packet
    }
    catch (err) {
      console.error(err)
      return null
    }
  }

  async searchPacket(start, end) {
    if (! (start != null && end != null && start <= end)) {
      return
    }
    this._refreshPacket()
    let list = []
    for (let id of this.packetList) {
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
