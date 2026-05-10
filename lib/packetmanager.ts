import EventEmitter from 'events'
import type { RawFleetShip, RawLBAC, RawSlotItem } from 'poi-lib-battle'
import { Battle, BattleType, Fleet } from 'poi-lib-battle'
import type { APIPortPortResponse } from 'kcsapi/api_port/port/response'
import type { APIReqMissionStartRequest } from 'kcsapi/api_req_mission/start/request'
import type { APIGetMemberMapinfoResponse } from 'kcsapi/api_get_member/mapinfo/response'
import type { APIReqAirCorpsSupplyRequest } from 'kcsapi/api_req_air_corps/supply/request'
import type { APIReqAirCorpsSupplyResponse } from 'kcsapi/api_req_air_corps/supply/response'
import type { APIReqAirCorpsSetPlaneRequest } from 'kcsapi/api_req_air_corps/set_plane/request'
import type { APIReqAirCorpsSetPlaneResponse } from 'kcsapi/api_req_air_corps/set_plane/response'
import type { APIReqAirCorpsSetActionRequest } from 'kcsapi/api_req_air_corps/set_action/request'
import type { APIReqMemberGetPracticeEnemyinfoResponse } from 'kcsapi/api_req_member/get_practice_enemyinfo/response'
import type { APIReqMapStartRequest } from 'kcsapi/api_req_map/start/request'
import type { APIReqMapStartResponse } from 'kcsapi/api_req_map/start/response'
import type { APIReqMapNextResponse } from 'kcsapi/api_req_map/next/response'

const { getStore } = window

class PacketManager extends EventEmitter {
  battle: Battle | null = null
  fleetType: number | null = null
  supportFleet: Array<RawFleetShip | null> | null = null
  normalSF: Array<RawFleetShip | null> | null = null
  bossSF: Array<RawFleetShip | null> | null = null
  landBaseAirCorps: RawLBAC[] | null = null
  api_base_corps: RawLBAC[] = []
  practiceOpponent: string | null = null

  constructor() {
    super()
    window.addEventListener('game.response', this.gameResponse as EventListener)
  }

  gameResponse = (e: CustomEvent) => {
    const req = e.detail
    const { body, time } = req
    const timestamp = time || Date.now()

    if (req.path === '/kcsapi/api_port/port') {
      const { body } = req as { body: APIPortPortResponse }
      const { normalSF, bossSF } = this
      this.normalSF = this.bossSF = null
      for (const deck of body.api_deck_port) {
        const mission = getStore(['const', '$missions', String(deck.api_mission[1])]) || {}
        const missionName = mission.api_name || ''
        if (missionName.includes('前衛支援任務')) {
          this.normalSF = normalSF
        }
        if (missionName.includes('決戦支援任務')) {
          this.bossSF = bossSF
        }
      }
    }
    if (req.path === '/kcsapi/api_req_mission/start') {
      const { postBody } = req as { postBody: APIReqMissionStartRequest }
      const fleetId = Number(postBody.api_deck_id)
      const mission = getStore(['const', '$missions', postBody.api_mission_id]) || {}
      const missionName = mission.api_name || ''
      if (missionName.includes('前衛支援任務')) {
        this.normalSF = this.getFleet(fleetId)
      }
      if (missionName.includes('決戦支援任務')) {
        this.bossSF = this.getFleet(fleetId)
      }
    }

    if (req.path === '/kcsapi/api_get_member/mapinfo') {
      const { body } = req as { body: APIGetMemberMapinfoResponse }
      this.api_base_corps = [...body.api_air_base]
    }
    if (['/kcsapi/api_req_air_corps/supply', '/kcsapi/api_req_air_corps/set_plane'].includes(req.path)) {
      const { body, postBody } = req as { body: APIReqAirCorpsSupplyResponse | APIReqAirCorpsSetPlaneResponse; postBody: APIReqAirCorpsSupplyRequest | APIReqAirCorpsSetPlaneRequest }
      const corps = this.api_base_corps[Number(postBody.api_base_id) - 1]
      corps.api_distance = body.api_distance
      for (const newp of body.api_plane_info) {
        for (let i = 0; i < corps.api_plane_info.length; i++) {
          const oldp = corps.api_plane_info[i]
          if (newp.api_squadron_id == oldp?.api_squadron_id) {
            corps.api_plane_info[i] = { ...newp }
          }
        }
      }
    }
    if (req.path === '/kcsapi/api_req_air_corps/set_action') {
      const { postBody } = req as { postBody: APIReqAirCorpsSetActionRequest }
      const baseIds = postBody.api_base_id.split(',')
      const actionKinds = postBody.api_action_kind.split(',')
      for (let i = 0; i < baseIds.length; i++) {
        const corps = this.api_base_corps[Number(baseIds[i]) - 1]
        corps.api_action_kind = parseInt(actionKinds[i])
      }
    }

    if (req.path === '/kcsapi/api_req_member/get_practice_enemyinfo') {
      const { body } = req as { body: APIReqMemberGetPracticeEnemyinfoResponse }
      this.practiceOpponent = `${body.api_nickname} (Lv.${body.api_level})`
    }

    if (req.path === '/kcsapi/api_req_map/start') {
      const { postBody } = req as { postBody: APIReqMapStartRequest }
      if (this.fleetType !== 0 && parseInt(postBody.api_deck_id) !== 1) {
        this.fleetType = 0
      }
    }

    if (['/kcsapi/api_port/port', '/kcsapi/api_start2/getData'].includes(req.path)) {
      const { body } = req as { body: { api_combined_flag?: number } }
      this.fleetType = body.api_combined_flag || 0
      this.emit('reset')
      this.battle = null
      this.supportFleet = null
      this.landBaseAirCorps = null
      this.practiceOpponent = null
      return
    }

    if (['/kcsapi/api_req_map/start', '/kcsapi/api_req_map/next'].includes(req.path)) {
      const { body } = req as { body: APIReqMapStartResponse | APIReqMapNextResponse }
      const isBoss = body.api_event_id === 5
      this.battle = new Battle({
        type: isBoss ? BattleType.Boss : BattleType.Normal,
        map: [body.api_maparea_id, body.api_mapinfo_no, body.api_no],
        desc: null,
        time: undefined,
        fleet: undefined,
        packet: [],
      })
      this.supportFleet = isBoss ? this.bossSF : this.normalSF
      return
    }

    if (req.path == '/kcsapi/api_req_practice/battle') {
      this.battle = new Battle({
        type: BattleType.Practice,
        map: [],
        desc: this.practiceOpponent,
        time: undefined,
        fleet: undefined,
        packet: [],
      })
      this.fleetType = 0
      this.supportFleet = null
      this.landBaseAirCorps = null
    }

    if (this.battle) {
      if (req.path === '/kcsapi/api_req_map/start_air_base') {
        const areaId = this.battle.map?.[0] ?? 0
        this.landBaseAirCorps = this.getLandBaseAirCorps(areaId)
        return
      }

      const packet: Record<string, unknown> = { ...body }
      packet.poi_path = req.path
      packet.poi_time = timestamp

      if (!this.battle.time) {
        this.battle.time = packet.poi_time as number
      }
      if (!this.battle.fleet) {
        const fleetId = [body.api_deck_id, body.api_dock_id].find((x): x is number => x != null)
        const escortId = ((this.fleetType ?? 0) > 0) ? 2 : -1
        this.battle.fleet = new Fleet({
          type: this.fleetType ?? 0,
          main: this.getFleet(fleetId ?? 0) ?? undefined,
          escort: this.getFleet(escortId) ?? undefined,
          support: this.supportFleet ?? undefined,
          LBAC: this.landBaseAirCorps ?? undefined,
        })
      }
      if (!this.battle.packet) {
        this.battle.packet = []
      }
      this.battle.packet.push(packet)

      if (req.path.includes('result')) {
        this.emit('result', { ...this.battle }, packet)
        this.battle = null
      } else {
        this.emit('battle', { ...this.battle }, packet)
      }
      return
    }
  }

  getFleet(deckId: number): Array<RawFleetShip | null> | null {
    const deck = getStore(['info', 'fleets', `${deckId - 1}`]) || {}
    const ships = deck.api_ship
    if (ships) {
      return ships.map((id: number) => this.getShip(id))
    }
    return null
  }

  getShip(shipId: number): RawFleetShip {
    const ship = { ...getStore(['info', 'ships', `${shipId}`]) }
    if (ship) {
      ship.poi_slot = ship.api_slot.map((id: number) => this.getItem(id))
      ship.poi_slot_ex = this.getItem(ship.api_slot_ex)
      delete ship.api_getmes
      delete ship.api_slot
      delete ship.api_slot_ex
      delete ship.api_yomi
    }
    return ship
  }

  getItem(itemId: number): RawSlotItem | undefined {
    const item = { ...window._slotitems[itemId] }
    if (item) {
      delete item.api_info
    }
    return item
  }

  getLandBaseAirCorps(areaId: number): RawLBAC[] {
    const landBaseAirCorps: RawLBAC[] = []
    for (let corps of this.api_base_corps) {
      if (!(corps.api_area_id == areaId && corps.api_action_kind === 1)) {
        continue
      }
      corps = { ...corps }
      for (const plane of corps.api_plane_info) {
        if (!plane) continue
        plane.poi_slot = this.getItem(plane.api_slotid)
        delete (plane as unknown as Record<string, unknown>).api_slotid
      }
      landBaseAirCorps.push(corps)
    }
    return landBaseAirCorps
  }
}

export default PacketManager
