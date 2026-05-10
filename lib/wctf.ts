import _ from 'lodash'
import { mapIdToStr } from 'subtender/kc'
import AppData from './appdata'
import type { Battle, RawFleetShip, RawSlotItem, RawLBAC, RawPlane } from 'poi-lib-battle'
import { BattleType } from 'poi-lib-battle'
import { parseEffMapId } from '../views/store/records'
import type { SortieIndex } from '../views/store/ext-root/sortie-indexes'

export const convertToWctf = async (sortieIndexes: SortieIndex) => {
  const { indexes: poiRecords, effMapId } = sortieIndexes
  const parsedMapId = parseEffMapId(effMapId)

  if (poiRecords.length === 0) throw new Error('cannot convert an empty record')

  const poiBattles = (await Promise.all(
    poiRecords.map((r) => AppData.loadBattle(r.id, false)),
  )) as (Battle | null)[]

  const fstBattle = poiBattles[0]
  if (!fstBattle?.fleet) throw new Error('Battle data is incomplete')
  const poiFleets: Array<Array<RawFleetShip | null> | null | undefined> = []

  poiFleets.push(fstBattle.fleet.main)
  poiFleets.push(fstBattle.fleet.escort)

  const normalSupportFleet = _.head(
    poiBattles.filter((b): b is Battle => b !== null && b.type === BattleType.Normal)
      .map((b) => b.fleet?.support)
      .filter((xs): xs is Array<RawFleetShip | null> => Array.isArray(xs) && xs.length > 0),
  )
  poiFleets.push(normalSupportFleet)

  const bossSupportFleet = _.head(
    poiBattles.filter((b): b is Battle => b !== null && b.type === BattleType.Boss)
      .map((b) => b.fleet?.support)
      .filter((xs): xs is Array<RawFleetShip | null> => Array.isArray(xs) && xs.length > 0),
  )
  poiFleets.push(bossSupportFleet)

  const wData: Record<string, unknown> = {}
  const fstRecord = poiRecords[0]
  if (parsedMapId !== null && parsedMapId !== 'pvp') {
    wData.name = `${fstRecord.desc} ${mapIdToStr(parsedMapId.mapId)} (${fstRecord.time})`
  } else {
    wData.name = `${fstRecord.desc} (${fstRecord.time})`
  }

  const wFleetArr = poiFleets.map((poiFleetInp) => {
    if (!Array.isArray(poiFleetInp)) return []
    const poiFleet = _.compact(poiFleetInp)
    const convertShip = (poiShip: RawFleetShip) => {
      const mstId = poiShip.api_ship_id
      const level = poiShip.api_lv
      const luck = poiShip.api_lucky[0]
      const wEquipInfoArr = [0, 1, 2, 3, 'ex'].map(ind => {
        const e = ind === 'ex'
          ? poiShip.poi_slot_ex as unknown as RawSlotItem | null | undefined
          : (poiShip.poi_slot ?? [])[ind as number]
        if (!e) return null
        return {
          mstId: e.api_slotitem_id,
          imp: _.isInteger(e.api_level) ? e.api_level : null,
          ace: _.isInteger(e.api_alv) ? e.api_alv : null,
        }
      })
      return [
        mstId, [level, luck],
        wEquipInfoArr.map(x => !x ? null : x.mstId),
        wEquipInfoArr.map(x => !x ? null : x.imp),
        wEquipInfoArr.map(x => !x ? null : x.ace),
      ]
    }
    return poiFleet.map(convertShip)
  })

  const poiLbas: RawLBAC[] = fstBattle?.fleet?.LBAC || []
  wData.name_airfields = poiLbas.map((x) => x.api_name)

  const wAirbase = [1, 2, 3].map(sqId => {
    const squadron = poiLbas[sqId - 1]
    if (!squadron || !Array.isArray(squadron.api_plane_info)) return []
    const convertEquip = (rawEquip: RawPlane | null) => {
      const poiSlot = rawEquip?.poi_slot?.[0]
      if (!poiSlot) return []
      const mstId = poiSlot.api_slotitem_id
      const ace = poiSlot.api_alv
      const imp = poiSlot.api_level
      return [mstId, _.isInteger(ace) ? ace : 0, _.isInteger(imp) ? imp : 0]
    }
    return squadron.api_plane_info.map(convertEquip)
  })

  wData.data = [...wFleetArr, wAirbase]
  return wData
}
