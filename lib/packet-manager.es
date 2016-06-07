"use strict"

const EventEmitter = require('events')
const {Battle, Fleet} = require('./models')

class PacketManager extends EventEmitter {
  constructor() {
    super()

    this.battle    = null
    this.fleetType = null

    this.supportFleet = null
    this.normalSF     = null
    this.bossSF       = null

    this.landBaseAirCorps   = null  // Prepare for fleet
    this.api_base_air_corps = null  // Raw api data

    this.praticeEnemy = null

    window.addEventListener('game.response', this.gameResponse.bind(this))
  }

  dispatch(battle) {
    if (!battle) {
      battle = this.battle
    }
    console.log('dispatch', battle)
    if (battle && battle.time) {
      this.emit('packet', battle.time, battle)
    }
  }

  gameResponse(e) {
    const req = e.detail
    const {body, postBody} = req
    const timestamp = Date.now()

    // Support fleet
    // NOTICE: We didn't check support fleet map.
    if (req.path === '/kcsapi/api_port/port') {
      let {normalSF, bossSF} = this
      this.normalSF = this.bossSF = null
      for (let deck of body.api_deck_port) {
        let mission = window.$missions[deck.api_mission[1]] || {}
        let missionName = mission.api_name || ''
        if (missionName.includes("前衛支援任務")) {
          this.normalSF = normalSF
        }
        if (missionName.includes("決戦支援任務")) {
          this.bossSF = bossSF
        }
      }
    }
    if (req.path === '/kcsapi/api_req_mission/start') {
      let fleetId = postBody.api_deck_id
      let mission = window.$missions[postBody.api_mission_id] || {}
      let missionName = mission.api_name || ''
      if (missionName.includes("前衛支援任務")) {
        this.normalSF = this.getFleet(fleetId)
      }
      if (missionName.includes("決戦支援任務")) {
        this.bossSF = this.getFleet(fleetId)
      }
    }

    // Land Base Air Corps
    if (req.path === '/kcsapi/api_get_member/base_air_corps') {
      this.api_base_air_corps = Object.clone(body)
    }
    if (req.path === '/kcsapi/api_req_air_corps/set_plane') {
      let corps = this.api_base_air_corps[postBody.api_base_id - 1]
      corps.api_distance = body.api_distance
      for (let newp of body.api_plane_info) {
        for (let i = 0; i < corps.api_plane_info.length; i++) {
          let oldp = corps.api_plane_info[i]
          // Use `==` to cast type automatically
          if (newp.api_squadron_id == oldp.api_squadron_id) {
            corps.api_plane_info[i] = newp
          }
        }
      }
    }
    if (req.path === '/kcsapi/api_req_air_corps/set_action') {
      let baseIds = postBody.api_base_id.split(',')
      let actionKinds = postBody.api_action_kind.split(',')
      for (let i = 0; i < baseIds.length; i++) {
        let corps = this.api_base_air_corps[baseIds[i] - 1]
        corps.api_action_kind = parseInt(actionKinds[i])
      }
    }

    // Pratice Enemy Information
    if (req.path === '/kcsapi/api_req_member/get_practice_enemyinfo') {
      this.praticeEnemy = `${body.api_nickname} (Lv.${body.api_level})`
    }


    // Oh fuck. Someone sorties with No.3/4 fleet when having combined fleet.
    if (req.path === '/kcsapi/api_req_map/start') {
      if (this.fleetType !== 0 && parseInt(postBody.api_deck_id) !== 1) {
        this.fleetType = 0
      }
    }

    // Reset all
    if (req.path === '/kcsapi/api_port/port') {
      // `api_combined_flag` is only available during event.
      // We assume it's 0 (normal fleet) because we can't combine fleet at peacetime.
      this.fleetType = body.api_combined_flag || 0

      this.battle = null
      this.supportFleet = null
      this.landBaseAirCorps = null
      this.praticeEnemy = null
      return
    }

    // Enter sortie battle
    if (['/kcsapi/api_req_map/start', '/kcsapi/api_req_map/next'].includes(req.path)) {
      let isBoss = (body.api_event_id === 5)
      let desc
      if (isBoss)
        desc = [__("Sortie"), "(Boss)"].join(' ')
      else
        desc = __("Sortie")

      this.battle = new Battle({
        map:    [body.api_maparea_id, body.api_mapinfo_no, body.api_no],
        desc:   desc,
        time:   null,  // Assign later
        fleet:  null,  // Assign later
        packet: [],
      })
      this.supportFleet = isBoss ? this.bossSF : this.normalSF
      return
    }

    // Enter pratice battle
    if (req.path == '/kcsapi/api_req_practice/battle') {
      this.battle = new Battle({
        map:    [],
        desc:   `${__('Pratice')} ${this.praticeEnemy}`,
        time:   null,  // Assign later
        fleet:  null,  // Assign later
        packet: [],
      })
      // Reset
      this.fleetType = 0
      this.supportFleet = null
      this.landBaseAirCorps = null
      // No `return`
    }

    // Process packet in battle
    if (this.battle) {
      // Battle Result
      if (req.path.includes('result')) {
        this.battle = null
        return
      }
      if (req.path === '/kcsapi/api_req_map/start_air_base') {
        this.landBaseAirCorps = this.getLandBaseAirCorps()
        return
      }
      // Check for battle packet
      // We assume that all battle packet include `api_deck_id`.
      let fleetId = body.api_deck_id || body.api_dock_id
      let escortId = (this.fleetType > 0) ? 2 : -1   // HACK: -1 for empty fleet.
      if (!fleetId) {
        return
      }

      let packet = Object.clone(body)
      packet.poi_path = req.path
      packet.poi_time = timestamp

      if (!this.battle.time) {
        this.battle.time = packet.poi_time
      }
      if (!this.battle.fleet) {
        this.battle.fleet = new Fleet({
          type:    this.fleetType,
          main:    this.getFleet(fleetId),
          escort:  this.getFleet(escortId),
          support: this.supportFleet,
          LBAC:    this.landBaseAirCorps,
        })
      }
      if (!this.battle.packet) {
        this.battle.packet = []
      }
      this.battle.packet.push(packet)
      this.dispatch()
      return
    }
  }

  // deckId in [1, 2, 3, 4]
  getFleet(deckId) {
    let deck = window._decks[deckId - 1] || {}
    let ships = deck.api_ship
    if (ships) {
      let fleet = []
      for (let id of ships) {
        fleet.push(this.getShip(id))
      }
      return fleet
    } else {
      return null
    }
  }

  getShip(shipId) {
    let ship = window._ships[shipId] || null
    if (ship) {
      ship.poi_slot = []
      for (let id of ship.api_slot) {
        ship.poi_slot.push(this.getItem(id))
      }
      ship.poi_slot_ex = this.getItem(ship.api_slot_ex)
      // Clean up
      delete ship.api_getmes
      delete ship.api_slot
      delete ship.api_slot_ex
      delete ship.api_yomi
    }
    return ship
  }

  getItem(itemId) {
    let item = window._slotitems[itemId] || null
    if (item) {
      // Clean up
      delete item.api_info
    }
    return item
  }

  getLandBaseAirCorps() {
    let landBaseAirCorps = []
    for (let corps of this.api_base_air_corps) {
      if (!(corps.api_action_kind === 1)) {
        continue
      }
      for (let plane of corps.api_plane_info) {
        plane.poi_slot = this.getItem(plane.api_slotid)
        // Clean up
        delete plane.api_slotid
      }
      landBaseAirCorps.push(corps)
    }
    return landBaseAirCorps
  }


  // Utils
  getId(packet) {
    if (packet == null) {
      return null
    }
    return packet.time || packet.poi_timestamp || null
  }

  getTime(packet) {
    if (packet == null) {
      return null
    }
    let str = ''
    let time = packet.time || packet.poi_timestamp
    if (time) {
      let date = new Date(time)
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
      str = date.toISOString().slice(0, 19).replace('T', ' ')
    }
    return str
  }

  getDesc(packet) {
    if (packet == null) {
      return null
    }
    let desc = []
    if (packet.version == null) {
      desc.push(packet.poi_comment)
    } else {
      desc.push(packet.desc)
      desc.push((packet.map || []).join('-'))
    }
    return desc.join(' ')
  }

  convertV1toV2(packet) {
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
    let battle = new Battle({
      map: [],
      desc: packet.poi_comment,
      time: packet.poi_timestamp,
      fleet: fleet,
      packet: packets,
    })
    return battle
  }
}

export default new PacketManager()
