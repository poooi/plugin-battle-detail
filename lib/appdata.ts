import fs from 'fs-extra'
import path from 'path-extra'
import zlib from 'zlib'
import { promisify } from 'util'
import CSV from './csv'
import { IndexCompat, PacketCompat } from './compat'

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
  columns: ['id', 'time_', 'map', 'route_', 'desc', 'rank'],
  auto_parse: true,
}

class AppData {
  constructor() {
    fs.ensureDir(APPDATA, (err: any) => {
      if (err) console.error(err.stack)
    })
    fs.ensureDir(TRASH, (err: any) => {
      if (err) console.error(err.stack)
    })

    IndexCompat.moveDB(APPDATA)
  }

  async saveFile(name: string, data: any) {
    if (!(name && data)) return
    if (path.parse(name).ext === GZIP_EXT) {
      data = await gzipAsync(data)
    }
    const fpath = path.join(APPDATA, name)
    await writeFileAsync(fpath, data)
  }

  async loadFile(name: string): Promise<string | null> {
    if (!name) return null
    try {
      const fpath = path.join(APPDATA, name)
      let data: any = await readFileAsync(fpath)
      if (path.parse(name).ext === GZIP_EXT) {
        data = await unzipAsync(data)
        data = data.toString()
      }
      return data
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err
    }
    return null
  }

  async saveIndex(index: any[]) {
    if (index != null) {
      const data = CSV.stringify(index, INDEX_CSV_OPTIONS)
      await this.saveFile(INDEX, data)
    }
  }

  async loadIndex(): Promise<any[]> {
    try {
      const data = await this.loadFile(INDEX)
      if (data != null) {
        return CSV.parse(data, INDEX_CSV_OPTIONS)
          .map((i: any) => IndexCompat.fmtIndex(i))
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT')
        console.error(`Failed to load index.`, '\n', err.stack)
    }
    return []
  }

  async saveBattle(id: number, battle: any) {
    if (!(id && battle)) return
    const name = `${id}.json` + GZIP_EXT
    const data = JSON.stringify(battle)
    await this.saveFile(name, data)
  }

  async loadBattle(id: number, applyPatch = true): Promise<any | null> {
    if (!id) return null
    try {
      let data: string | null = null
      for (const name of [`${id}.json` + GZIP_EXT, `${id}.json`]) {
        data = await this.loadFile(name)
        if (data != null) break
      }
      if (data != null) {
        let battle = JSON.parse(data)
        if (!applyPatch) return battle
        battle = PacketCompat.v10tov21(battle)
        battle = PacketCompat.v20tov21(battle)
        battle = PacketCompat.fix20170405(battle)
        battle = PacketCompat.fix20171117(battle)
        battle = PacketCompat.fix20221109(battle)
        return battle
      }
    } catch (err: any) {
      console.error(`Failed to load battle ${id}. Moving it to trash.`, '\n', err.stack)
      await this.trashBattle(id)
    }
    return null
  }

  async trashBattle(id: number) {
    if (!id) return
    for (const name of [`${id}.json` + GZIP_EXT, `${id}.json`]) {
      try {
        const oldPath = path.join(APPDATA, name)
        const newPath = path.join(TRASH, name)
        await renameAsync(oldPath, newPath)
      } catch (err: any) {
        if (err.code !== 'ENOENT')
          console.error(`Failed to trash battle ${name}`, '\n', err.stack)
      }
    }
  }

  async listBattle(): Promise<number[]> {
    const BATTLE_REGEXP = /^(\d+)\.json/
    const ids: number[] = []
    const files = await readDirAsync(APPDATA)
    ;(files as string[]).forEach((file) => {
      const match = file.match(BATTLE_REGEXP)
      if (match && match[1]) {
        ids.push(parseInt(match[1]))
      }
    })
    return ids
  }
}

const appDataInst = new AppData()
window.AppData = appDataInst

export default appDataInst
