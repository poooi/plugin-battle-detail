
import EventEmitter from 'events'
import { Battle, BattleType, Fleet } from './battle'

const {getStore} = window

class PacketManager extends EventEmitter {
  constructor() {
    super()

    this.battle    = null
    this.fleetType = null

    this.supportFleet = null
    this.normalSF     = null
    this.bossSF       = null

    this.landBaseAirCorps   = null  // Prepare for fleet
    this.api_base_corps     = null  // Raw api data

    this.practiceOpponent = null

    window.addEventListener('game.response', this.gameResponse)
  }

  gameResponse = (e) => {
    const req = e.detail
    const {body, postBody, time} = req
    const timestamp = time || Date.now()

    // Support fleet
    // NOTICE: We didn't check support fleet map.
    if (req.path === '/kcsapi/api_port/port') {
      let {normalSF, bossSF} = this
      this.normalSF = this.bossSF = null
      for (let deck of body.api_deck_port) {
        let mission = getStore(['const', '$missions', deck.api_mission[1]]) || {}
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
      let mission = getStore(['const', '$missions', postBody.api_mission_id]) || {}
      let missionName = mission.api_name || ''
      if (missionName.includes("前衛支援任務")) {
        this.normalSF = this.getFleet(fleetId)
      }
      if (missionName.includes("決戦支援任務")) {
        this.bossSF = this.getFleet(fleetId)
      }
    }

    // Land Base Air Corps
    if (req.path === '/kcsapi/api_get_member/mapinfo') {
      this.api_base_corps = Object.clone(body.api_air_base || [])
    }
    if (['/kcsapi/api_req_air_corps/supply', '/kcsapi/api_req_air_corps/set_plane'].includes(req.path)) {
      let corps = this.api_base_corps[postBody.api_base_id - 1]
      corps.api_distance = body.api_distance
      for (let newp of body.api_plane_info) {
        for (let i = 0; i < corps.api_plane_info.length; i++) {
          let oldp = corps.api_plane_info[i]
          // Use `==` to cast type automatically
          if (newp.api_squadron_id == oldp.api_squadron_id) {
            corps.api_plane_info[i] = Object.clone(newp)
          }
        }
      }
    }
    if (req.path === '/kcsapi/api_req_air_corps/set_action') {
      let baseIds = postBody.api_base_id.split(',')
      let actionKinds = postBody.api_action_kind.split(',')
      for (let i = 0; i < baseIds.length; i++) {
        let corps = this.api_base_corps[baseIds[i] - 1]
        corps.api_action_kind = parseInt(actionKinds[i])
      }
    }

    // Practice Enemy Information
    if (req.path === '/kcsapi/api_req_member/get_practice_enemyinfo') {
      this.practiceOpponent = `${body.api_nickname} (Lv.${body.api_level})`
    }


    // Oh fuck. Someone sorties with No.3/4 fleet when having combined fleet.
    if (req.path === '/kcsapi/api_req_map/start') {
      if (this.fleetType !== 0 && parseInt(postBody.api_deck_id) !== 1) {
        this.fleetType = 0
      }
    }

    // Reset all
    if (['/kcsapi/api_port/port', '/kcsapi/api_start2/getData'].includes(req.path)) {
      // `api_combined_flag` is only available during event.
      // We assume it's 0 (normal fleet) because we can't combine fleet at peacetime.
      this.fleetType = body.api_combined_flag || 0

      this.emit('reset')
      this.battle = null
      this.supportFleet = null
      this.landBaseAirCorps = null
      this.practiceOpponent = null
      return
    }

    // Enter sortie battle
    if (['/kcsapi/api_req_map/start', '/kcsapi/api_req_map/next'].includes(req.path)) {
      let isBoss = (body.api_event_id === 5)
      this.battle = new Battle({
        type:   isBoss ? BattleType.Boss : BattleType.Normal,
        map:    [body.api_maparea_id, body.api_mapinfo_no, body.api_no],
        desc:   null,
        time:   null,  // Assign later
        fleet:  null,  // Assign later
        packet: [],
      })
      this.supportFleet = isBoss ? this.bossSF : this.normalSF
      return
    }

    // Enter practice battle
    if (req.path == '/kcsapi/api_req_practice/battle') {
      this.battle = new Battle({
        type:   BattleType.Practice,
        map:    [],
        desc:   this.practiceOpponent,
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
      if (req.path === '/kcsapi/api_req_map/start_air_base') {
        let areaId = this.battle.map[0]
        this.landBaseAirCorps = this.getLandBaseAirCorps(areaId)
        return
      }

      let packet = Object.clone(body)
      packet.poi_path = req.path
      packet.poi_time = timestamp

      if (!this.battle.time) {
        this.battle.time = packet.poi_time
      }
      if (!this.battle.fleet) {
        let fleetId = [body.api_deck_id, body.api_dock_id].find((x) => x != null)
        let escortId = (this.fleetType > 0) ? 2 : -1   // HACK: -1 for empty fleet.
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

      // Battle Result
      if (req.path.includes('result')) {
        this.emit('result', Object.clone(this.battle), packet)
        this.battle = null
      } else {
        this.emit('battle', Object.clone(this.battle), packet)
      }
      return
    }
  }

  // deckId in [1, 2, 3, 4]
  getFleet(deckId) {
    let deck = getStore(['info', 'fleets', deckId - 1]) || {}
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
    let ship = Object.clone(getStore(['info', 'ships', shipId]) || null)
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
    let item = Object.clone(window._slotitems[itemId] || null)
    if (item) {
      // Clean up
      delete item.api_info
    }
    return item
  }

  getLandBaseAirCorps(areaId) {
    let landBaseAirCorps = []
    for (let corps of this.api_base_corps) {
      // Use `==` to cast automatically.
      if (!(corps.api_area_id == areaId && corps.api_action_kind === 1)) {
        continue
      }
      corps = Object.clone(corps)
      for (let plane of corps.api_plane_info) {
        plane.poi_slot = this.getItem(plane.api_slotid)
        // Clean up
        delete plane.api_slotid
      }
      landBaseAirCorps.push(corps)
    }
    return landBaseAirCorps
  }
}

export default PacketManager
