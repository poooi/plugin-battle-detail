import _ from 'lodash'
import AppData from './appdata'
import type { Battle, RawFleetShip, RawSlotItem, RawLBAC } from 'poi-lib-battle'
import { BattleType } from 'poi-lib-battle'
import { parseEffMapId } from '../views/store/records'
import type { SortieIndex } from '../views/store/ext-root/sortie-indexes'
import type { BattleIndex } from '../views/store/ext-root/indexes'

export const convertReplay = async (sortieIndexes: SortieIndex) => {
  const { indexes: poiRecords, effMapId } = sortieIndexes

  const parsedMapId = parseEffMapId(effMapId)
  if (parsedMapId === null) {
    console.warn(`parse error on ${effMapId}, generated replay might have wrong map info.`)
  }

  if (poiRecords.length === 0) throw new Error('cannot convert an empty record')

  const poiBattles = (await Promise.all(
    poiRecords.map((r) => AppData.loadBattle(r.id, false)),
  )) as (Battle | null)[]

  const fstRecord: BattleIndex = poiRecords[0]
  const fstBattle = poiBattles[0]
  if (!fstBattle?.fleet) throw new Error('Battle data is incomplete')

  const isPvP = fstBattle?.type === BattleType.Practice

  if (poiRecords.length > 1) {
    if (isPvP) console.warn('PvP record should contain exactly one battle')
    const mapStrs = _.uniq(poiRecords.map((r) => r.map))
    if (mapStrs.length !== 1) console.warn('mapStr is not unique')
    if (mapStrs[0] === '') console.warn('expecting mapStr to be non-empty')
  }

  const whichMap = (() => {
    if (parsedMapId === 'pvp' || parsedMapId === null) {
      return { world: 0, mapnum: 0 }
    } else {
      const { mapArea: world, mapNo: mapnum } = parsedMapId
      return { world, mapnum }
    }
  })()

  const combined = fstBattle.fleet.type
  const support1 = 3
  const support2 = 4

  const transformFleet = (fleetPoi: Array<RawFleetShip | null> | null | undefined) => {
    if (!fleetPoi) return []
    const transformShip = (ship: RawFleetShip | null) => {
      if (!ship) return false
      const normalSlots = [0, 1, 2, 3].map(slotInd => _.get(ship.poi_slot, slotInd))
      const slots = [...normalSlots, ship.poi_slot_ex as unknown as RawSlotItem | null | undefined]
      return {
        mst_id: ship.api_ship_id,
        level: ship.api_lv,
        kyouka: ship.api_kyouka,
        morale: ship.api_cond,
        equip: slots.map((eqp) => _.get(eqp, 'api_slotitem_id', 0)),
        stars: slots.map((eqp) => _.get(eqp, 'api_level', 0)),
        ace: slots.map((eqp) => _.get(eqp, 'api_alv', -1)),
      }
    }
    return _.compact(fleetPoi.map(transformShip))
  }

  const fleet1 = transformFleet(fstBattle.fleet.main)
  const fleet2 = transformFleet(fstBattle.fleet.escort)
  const fleet3 = transformFleet(
    _.head(
      poiBattles
        .filter((b): b is Battle => b !== null && b.type === 'Normal')
        .map((b) => b.fleet?.support)
        .filter((xs): xs is Array<RawFleetShip | null> => Array.isArray(xs) && xs.length > 0),
    ),
  )
  const fleet4 = transformFleet(
    _.head(
      poiBattles
        .filter((b): b is Battle => b !== null && b.type === 'Boss')
        .map((b) => b.fleet?.support)
        .filter((xs): xs is Array<RawFleetShip | null> => Array.isArray(xs) && xs.length > 0),
    ),
  )

  const transformLbas = (lbasPoi: RawLBAC[] | null | undefined) => {
    if (!lbasPoi) return {}
    const transformSquadron = (sq: RawLBAC) => {
      const planes = sq.api_plane_info.map((p) => {
        const slot = p?.poi_slot
        if (!slot) return null
        return {
          mst_id: slot.api_slotitem_id,
          count: p.api_count,
          stars: _.get(p, 'api_level', 0),
          ace: slot.api_alv,
          state: p.api_state,
          morale: p.api_cond,
        }
      })
      return { rid: sq.api_rid, range: sq.api_distance, action: sq.api_action_kind, planes }
    }
    return lbasPoi.map(transformSquadron)
  }

  const transformBattle = (battlePoi: Battle) => {
    const node = battlePoi.map?.[2]
    type PacketLike = { poi_path: string; api_midnight_flag?: number }
    const [battlePackets] = _.partition(
      (battlePoi.packet ?? []) as PacketLike[],
      (p) =>
        p.poi_path.indexOf('battle_result') === -1 &&
        p.poi_path.indexOf('battleresult') === -1,
    )
    const [dayBattles, nightBattles] = _.partition(
      battlePackets,
      (p) => 'api_midnight_flag' in p,
    )
    const data = dayBattles[0] || {}
    const yasen = nightBattles[0] || {}
    return { node, data, yasen }
  }

  const lbas = transformLbas(fstBattle.fleet.LBAC)
  const battles = poiBattles.map(transformBattle)

  const replayData = {
    ...whichMap, fleetnum: 1, combined, support1, support2,
    fleet1, fleet2, fleet3, fleet4, lbas, battles,
  }

  const desc = (() => {
    if (parsedMapId === 'pvp' || parsedMapId === null) {
      return fstRecord.desc
    } else {
      const { mapArea, mapNo } = parsedMapId
      return `${fstRecord.desc} ${mapArea}-${mapNo}`
    }
  })()

  const timeStrs = poiRecords.length > 0
    ? [fstRecord.time, _.last(poiRecords)?.time]
    : [fstRecord.time]

  const routes = isPvP
    ? []
    : poiRecords.map((r, ind: number) => {
      const poiBattle = poiBattles[ind]
      const type = poiBattle?.type
      if (!['Normal', 'Boss'].includes(type ?? ''))
        console.warn(`unexpected record type: ${type}`)
      return { edge: r.route_, type }
    })

  const translateFleet = (poiFleet: Array<RawFleetShip | null> | undefined) => {
    if (!poiFleet || _.isEmpty(poiFleet)) return null
    const mstIds = poiFleet
      .map((x) => x && typeof x === 'object' && x.api_ship_id)
      .filter((x): x is number => _.isInteger(x))
    return mstIds.length > 0 ? mstIds : null
  }

  const fleets = _.compact(
    [fstBattle.fleet.main, fstBattle.fleet.escort].map(translateFleet),
  )

  const imageInfo = { isPvP, desc, timeStrs, effMapId, routes, fleets }

  return { replayData, imageInfo }
}
