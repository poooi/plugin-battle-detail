
import fs from 'fs-extra'
import path from 'path-extra'

import { Models } from 'lib/battle'
const { Battle, BattleType, Fleet } = Models
const { __ } = window

export class PacketCompat {
  static getId(packet) {
    if (packet == null) return
    return packet.time || packet.poi_timestamp || null
  }

  static getTime(packet) {
    if (packet == null) return
    let str = ''
    if (packet.time) {
      let date = new Date(packet.time)
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
      str = date.toISOString().slice(0, 19).replace('T', ' ')
    }
    return str
  }

  static getMap(packet) {
    if (packet == null) return
    let map = packet.map
    if (map instanceof Array && map.length > 0) {
      return `${map[0]}-${map[1]} (${map[2]})`
    }
  }

  static getDesc(packet) {
    if (packet == null) return
    if (packet.type === BattleType.Normal) {
      return `${__("Sortie")}`
    }
    if (packet.type === BattleType.Boss) {
      return `${__("Sortie")} (Boss)`
    }
    if (packet.type === BattleType.Pratice) {
      return `${__("Pratice")} ${packet.desc}`
    }
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
    if (packet.api_hougeki) {
      packets.push({
        api_hougeki: packet.api_hougeki,
        poi_path: '/kcsapi/api_req_battle_midnight/battle',
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
}
