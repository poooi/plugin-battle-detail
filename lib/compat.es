
import _ from 'lodash'
import fs from 'fs-extra'
import path from 'path-extra'

import { Simulator, Models } from 'lib/battle'
const { Battle, BattleType, Fleet } = Models
const { Rank } = Models
const { __, getStore } = window

function tree2path(tree) {
  const pathes = []
  const queue = [{
    path: [],
    node: tree,
  }]
  let cur = null
  while((cur = queue.shift()) != null) {
    const { path, node } = cur
    if (node instanceof Object) {
      for (const [key, val] of Object.entries(node))
        queue.push({
          path: [].concat(path, key),
          node: val,
        })
    }
    else {
      pathes.push(path)
    }
  }
  return pathes
}

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
    if (battle.type === BattleType.Practice) {
      return `${__("Practice")} ${battle.desc}`
    }
  }

  static fmtTitle(battle) {
    if (battle == null) return
    if (battle.map == null) battle.map = []
    const time   = PacketCompat.fmtTime(battle.time)
    const map    = battle.map.slice(0, 2).join('-')
    const route_ = battle.map[2]
    const route  = IndexCompat.getRoute(map, route_)
    const desc   = PacketCompat.getDesc(battle)
    return `${time} ${desc} ${map} ${route}`
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
      type = BattleType.Practice
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
      type = BattleType.Practice
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

  // Ship id change from 500+ to 1000+ on 2017-04-05.
  // 1491372000000: 2017-04-05T06:00:00.000Z
  static fix20170405(battle) {
    if (battle.time >= 1491372000000)
      return battle
    for (const packet of battle.packet) {
      for (const k of ['api_ship_ke', 'api_ship_ke_combined']) {
        if (packet[k] != null)
          packet[k] = packet[k].map(n => n > 500 ? n + 1000 : n)
      }
    }
    return battle
  }

  // Ship index change starting from 1 to 0 on 2017-11-17.
  // 1510898400000: 2017-11-17T06:00:00.000Z
  static fix20171117_shift_pathes = (() => {
    const hougeki = {
      'api_at_list': 1,
      'api_at_type': 1,
      'api_df_list': 1,
      'api_si_list': 1,
      'api_cl_list': 1,
      'api_damage' : 1,
    }
    const raigeki = {
      'api_frai' : 1,
      'api_erai' : 1,
      'api_fdam' : 1,
      'api_edam' : 1,
      'api_fydam': 1,
      'api_eydam': 1,
      'api_fcl'  : 1,
      'api_ecl'  : 1,
    }
    const kouku_stage3 = {
      'api_frai_flag': 1,
      'api_erai_flag': 1,
      'api_fbak_flag': 1,
      'api_ebak_flag': 1,
      'api_fcl_flag' : 1,
      'api_ecl_flag' : 1,
      'api_fdam'     : 1,
      'api_edam'     : 1,
    }
    const kouku = {
      'api_stage3'         : kouku_stage3,
      'api_stage3_combined': kouku_stage3,
    }
    const tree = {
      'api_ship_ke': 1,
      'api_ship_lv': 1,
      'api_nowhps' : 1,
      'api_maxhps' : 1,
      'api_nowhps_combined': 1,
      'api_maxhps_combined': 1,
      'api_hougeki'       : hougeki,
      'api_hougeki1'      : hougeki,
      'api_hougeki2'      : hougeki,
      'api_hougeki3'      : hougeki,
      'api_opening_taisen': hougeki,
      'api_raigeki'      : raigeki,
      'api_opening_atack': raigeki,
      'api_kouku'             : kouku,
      'api_kouku2'            : kouku,
      'api_injection_kouku'   : kouku,
      'api_air_base_injection': kouku,
      'api_air_base_attack': Array(6).fill(kouku),
      'api_support_info': {
        'api_support_airatack': kouku,
        'api_support_hourai': hougeki,
      },
    }
    return tree2path(tree)
  })()
  static fix20171117_index_pathes = (() => {
    const hougeki = {
      'api_at_list': 1,
      'api_df_list': Array(12).fill(1),
    }
    const raigeki = {
      'api_frai' : 1,
      'api_erai' : 1,
    }
    const kouku_stage3 = {
      'api_frai_flag': 1,
      'api_erai_flag': 1,
      'api_fbak_flag': 1,
      'api_ebak_flag': 1,
    }
    const kouku = {
      'api_stage3'         : kouku_stage3,
      'api_stage3_combined': kouku_stage3,
    }
    const tree = {
      'api_hougeki'       : hougeki,
      'api_hougeki1'      : hougeki,
      'api_hougeki2'      : hougeki,
      'api_hougeki3'      : hougeki,
      'api_opening_taisen': hougeki,
      'api_raigeki'      : raigeki,
      'api_opening_atack': raigeki,
      'api_kouku'             : kouku,
      'api_kouku2'            : kouku,
      'api_injection_kouku'   : kouku,
      'api_air_base_injection': kouku,
      'api_air_base_attack': Array(6).fill(kouku),
      'api_support_info': {
        'api_support_airatack': kouku,
        'api_support_hourai': hougeki,
      },
    }
    return tree2path(tree)
  })()
  static fix20171117_splice_pairs = {
    'api_e_nowhps': 'api_nowhps',
    'api_e_maxhps': 'api_maxhps',
    'api_e_nowhps_combined': 'api_nowhps_combined',
    'api_e_maxhps_combined': 'api_maxhps_combined',
  }
  static fix20171117(battle) {
    if (battle.time >= 1510898400000)
      return battle
    for (const packet of battle.packet) {
      for (const path of this.fix20171117_shift_pathes) {
        const cur = _.get(packet, path)
        if (cur != null) {
          cur.shift()
        }
      }
      for (const path of this.fix20171117_index_pathes) {
        const cur = _.get(packet, path)
        if (cur != null) {
          // cur.forEach((v, i, a) => a[i] = v - 1)
          for (let i = 0; i < cur.length; i++) {
            cur[i] = cur[i] - 1
          }
        }
      }
      for (const [dst, src] of Object.entries(this.fix20171117_splice_pairs)) {
        if (packet[src] != null)
          packet[dst] = packet[src].splice(6)
      }
    }
    return battle
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

  static getRoute(map, rid) {
    if (rid == null || rid == '') return ''
    const a = _.get(getStore(), `fcd.map.${map}.route.${rid}`, [])
    return `${a.join('-')} (${rid})`
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
    const route  = IndexCompat.getRoute(map, route_)
    const desc   = PacketCompat.getDesc(battle)
    const rank   = IndexCompat.RankMap[simulator.result.rank]
    return {id, time_, time, map, route_, route, desc, rank}
  }

  // Format index from CSV in-place
  static fmtIndex(index) {
    if (index == null) return
    const {map, route_} = index
    index.time  = PacketCompat.fmtTime(index.time_)
    index.route = IndexCompat.getRoute(map, route_)
    return index
  }
}
