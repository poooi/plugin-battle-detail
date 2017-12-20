
import fs from 'fs-extra'
import path from 'path-extra'
import zlib from 'zlib'
import { promisify } from 'bluebird'
import CSV from 'lib/csv'
import { IndexCompat, PacketCompat } from 'lib/compat'

const renameAsync = promisify(fs.rename)
const readDirAsync = promisify(fs.readdir)
const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)
const gzipAsync = promisify(zlib.gzip)
const unzipAsync = promisify(zlib.unzip)
const GZIP_EXT = '.gz'

const APPDATA = path.join(window.APPDATA_PATH, 'battle-detail')
const TRASH = path.join(APPDATA, 'trash')
const INDEX = 'index11.csv' + GZIP_EXT
const INDEX_CSV_OPTIONS = {
  // See compat.es/PacketCompact
  columns: ['id', 'time_', 'map', 'route_', 'desc', 'rank'],
  auto_parse: true,
}

class AppData {
  constructor() {
    fs.ensureDir(APPDATA, (err) => {
      if (err) console.error(err.stack)
    })
    fs.ensureDir(TRASH, (err) => {
      if (err) console.error(err.stack)
    })

    IndexCompat.moveDB(APPDATA)
  }

  async saveFile(name, data) {
    if (!(name && data)) return
    if (path.parse(name).ext === GZIP_EXT) {
      data = await gzipAsync(data)
    }
    let fpath = path.join(APPDATA, name)
    await writeFileAsync(fpath, data)
  }

  async loadFile(name) {
    if (!(name)) return
    try {
      let fpath = path.join(APPDATA, name)
      let data = await readFileAsync(fpath)
      if (path.parse(name).ext === GZIP_EXT) {
        data = await unzipAsync(data)
        data = data.toString()
      }
      return data
    }
    catch (err) {
      if (err.code !== 'ENOENT')
        throw err
    }
    return null
  }

  async saveIndex(index) {
    if (index != null) {
      let data = CSV.stringify(index, INDEX_CSV_OPTIONS)
      await this.saveFile(INDEX, data)
    }
  }

  async loadIndex() {
    try {
      let data = await this.loadFile(INDEX)
      if (data != null) {
        return CSV.parse(data, INDEX_CSV_OPTIONS)
          .map(i => IndexCompat.fmtIndex(i))
      }
    }
    catch (err) {
      if (err.code !== 'ENOENT')
        console.error(`Failed to load index.`, '\n', err.stack)
    }
    return []
  }

  async saveBattle(id, battle) {
    if (!(id && battle))
      return
    let name = `${id}.json` + GZIP_EXT
    let data = JSON.stringify(battle)
    await this.saveFile(name, data)
  }

  async loadBattle(id, applyPatch = true) {
    if (!(id))
      return
    try {
      // Compatibility: Read 123456.json.gz & 123456.json
      let data
      for (let name of [`${id}.json` + GZIP_EXT, `${id}.json`]) {
        data = await this.loadFile(name)
        if (data != null)
          break
      }
      if (data != null) {
        let battle = JSON.parse(data)
        if (!applyPatch) {
          return battle
        }
        // Compatibility: Battle packet format
        battle = PacketCompat.v10tov21(battle)
        battle = PacketCompat.v20tov21(battle)
        battle = PacketCompat.fix20170405(battle)
        battle = PacketCompat.fix20171117(battle)
        return battle
      }
    }
    catch (err) {
      console.error(`Failed to load battle ${id}. Moving it to trash.`, '\n', err.stack)
      await this.trashBattle(id)
    }
    return null
  }

  async trashBattle(id) {
    if (!(id))
      return
    // Compatibility: Read 123456.json.gz & 123456.json
    for (let name of [`${id}.json` + GZIP_EXT, `${id}.json`]) {
      try {
        let oldPath = path.join(APPDATA, name)
        let newPath = path.join(TRASH, name)
        await renameAsync(oldPath, newPath)
      }
      catch (err) {
        if (err.code !== 'ENOENT')
          console.error(`Failed to trash battle ${name}`, '\n', err.stack)
      }
    }
  }

  async listBattle() {
    const BATTLE_REGEXP = /^(\d+)\.json/
    let ids = []
    let files = await readDirAsync(APPDATA)
    files.map((file, i) => {
      let match = file.match(BATTLE_REGEXP)
      if (match && match[1]) {
        ids.push(parseInt(match[1]))
      }
    })
    return ids
  }
}

export default new AppData()
