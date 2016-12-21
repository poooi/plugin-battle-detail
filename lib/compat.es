
import fs from 'fs-extra'
import path from 'path-extra'

import { Simulator, Models } from 'lib/battle'
const { Battle, BattleType, Fleet } = Models
const { Rank } = Models
const { __, getStore } = window

export class PacketCompat {
  static getId(battle) {
    if (battle == null) return
    return battle.time || battle.poi_timestamp || null
  }

  static getDesc(battle) {
    if (battle == null) return
    if (battle.type === BattleType.Normal) {
      return `${__("Sortie")}`
    }
    if (battle.type === BattleType.Boss) {
      return `${__("Sortie")} (boss)`
    }
    if (battle.type === BattleType.Pratice) {
      return `${__("Pratice")} ${battle.desc}`
    }
  }

  static fmtTitle(battle) {
    if (battle == null) return
    if (battle.map == null) battle.map = []
    const time   = PacketCompat.fmtTime(battle.time)
    const map    = battle.map.slice(0, 2).join('-')
    const route_ = battle.map[2]
    const routeA = getStore(`fcd.map.${map}.route.${route_}`) || []  // temp array
    const route  = `${routeA.join('-')} (${route_})`
    const desc   = PacketCompat.getDesc(battle)
    return `${time} ${map} ${route} ${desc}`
  }

  // Format timestamp to time string
  static fmtTime(timestamp) {
    let str = ''
    if (timestamp != null) {
      let date = new Date(timestamp)
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
      str = date.toISOString().slice(0, 19).replace('T', ' ')
    }
    return str
  }

  static v10tov21(packet) {
    if (packet == null) {
      return null
    }
    if (packet.version != null) {
      return packet
    }
    function convertFleet(poi_fleet, poi_equipment, api_nowhps) {
      if (! (poi_fleet && poi_fleet.length > 0 )) {
        return null
      }
      let fleet = []
      for (let i of Array(6).keys()) {
        let shipId = poi_fleet[i]
        let ship = window.$ships[shipId] || null
        if (ship) {
          ship.api_ship_id = shipId
          ship.api_maxhp = ship.api_taik[1]
          ship.api_nowhp = api_nowhps[i + 1]
          ship.poi_slot = []
          ship.poi_slot_ex = null
          for (let j of Array(6).keys()) {
            let itemId = poi_equipment[i][j]
            let item = window.$slotitems[itemId] || null
            if (item) {
              item.api_slotitem_id = itemId
            }
            ship.poi_slot.push(item)
          }
        }
        fleet.push(ship)
      }
      return fleet
    }
    let mainFleet = convertFleet(packet.poi_sortie_fleet, packet.poi_sortie_equipment, packet.api_nowhps)
    let escortFleet = convertFleet(packet.poi_combined_fleet, packet.poi_combined_equipment, packet.api_nowhps_combined)
    if (mainFleet == null && (packet.api_fParam || []).length > 0) {
      throw new Error('Broken packet data')
    }
    let fleet = new Fleet({
      type:    packet.poi_is_combined ? (packet.poi_is_carrier ? 1: 2) : 0,
      main:    mainFleet,
      escort:  escortFleet,
      support: null,
      LBAC:    null,
    })
    let packets = [packet]
    packet.poi_path = packet.poi_uri
    packet.poi_time = packet.poi_timestamp
    if (packet.api_hougeki && !packet.poi_uri.includes('sp_midnight')) {
      packets.push({
        api_hougeki: packet.api_hougeki,
        poi_path: '!COMPAT/midnight_battle',
      })
      delete packet.api_hougeki
    }
    let type = null, map = null, desc = null
    let pm = packet.poi_comment.match(/(Pratice|演習|演习|演習) (.+)/)
    if (pm) {
      type = BattleType.Pratice
      desc = pm[2]
    } else {
      let match = packet.poi_comment.match(/^(.+?) (\d+)-(\d+) \((\d+)(, boss)?\)$/)
      if (match) {
        type = match[5] ? BattleType.Boss : BattleType.Normal
        map = [match[2], match[3], match[4]]
      }
    }
    return new Battle({
      version: "1.0",
      type: type,
      map:  map,
      desc: desc,
      time: packet.poi_timestamp,
      fleet:  fleet,
      packet: packets,
    })
  }

  static v20tov21(battle) {
    if (battle == null) {
      return null
    }
    if (battle.version != "2.0") {
      return battle
    }
    let type = null, desc = null
    let pm = battle.desc.match(/(Pratice|演習|演习|演習) (.+)/)
    if (pm) {
      type = BattleType.Pratice
      desc = pm[2]
    } else if (battle.desc.includes("(Boss)")) {
      type = BattleType.Boss
    } else {
      type = BattleType.Normal
    }
    return new Battle({
      version: battle.version,
      type: type,
      map:  battle.map,
      desc: desc,
      time: battle.time,
      fleet:  battle.fleet,
      packet: battle.packet,
    })
  }
}

export class IndexCompat {
  static moveDB(APPDATA) {
    // We decided no moving `manifest.1.csv` but force recreate `index10.csv`.
    let manifest = path.join(APPDATA, 'manifest.1.csv.gz')
    if (fs.existsSync(manifest)) {
      fs.unlinkSync(manifest)
    }
  }

  static RankMap = {
    [Rank.SS]: 'SS',
    [Rank.S ]: 'S',
    [Rank.A ]: 'A',
    [Rank.B ]: 'B',
    [Rank.C ]: 'C',
    [Rank.D ]: 'D',
    [Rank.E ]: 'E',
  }

  static getIndex(battle, id, simulator) {
    if (battle == null) return
    if (battle.map == null) battle.map = []
    if (id == null) id = PacketCompat.getId(battle)
    if (simulator == null) simulator = Simulator.auto(battle)
    const time_  = battle.time
    const time   = PacketCompat.fmtTime(time_)
    const map    = battle.map.slice(0, 2).join('-')
    const route_ = battle.map[2]
    const routeA = getStore(`fcd.map.${map}.route.${route_}`) || []  // temp array
    const route  = `${routeA.join('-')} (${route_})`
    const desc   = PacketCompat.getDesc(battle)
    const rank   = IndexCompat.RankMap[simulator.result.rank]
    return {id, time_, time, map, route_, route, desc, rank}
  }

  // Format index from CSV in-place
  static fmtIndex(index) {
    if (index == null) return
    const {map, route_} = index
    index.time  = PacketCompat.fmtTime(index.time_)
    const routeA = getStore(`fcd.map.${map}.route.${route_}`)
    index.route = routeA ? routeA.join('-') : ''
    return index
  }
}
