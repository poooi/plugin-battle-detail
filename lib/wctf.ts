import _ from 'lodash'
import { mapIdToStr } from 'subtender/kc'
import AppData from './appdata'

export const convertToWctf = async (sortieIndexes: any) => {
  const { indexes: poiRecords, mapId } = sortieIndexes

  if (poiRecords.length === 0) throw new Error('cannot convert an empty record')

  const poiBattles = await Promise.all(
    poiRecords.map((r: any) => AppData.loadBattle(r.id, false))
  )

  const fstBattle = poiBattles[0]
  const poiFleets: any[] = []

  poiFleets.push(fstBattle.fleet.main)
  poiFleets.push(fstBattle.fleet.escort)

  const normalSupportFleet = _.head(
    poiBattles.filter((b: any) => b.type === 'Normal')
      .map((b: any) => b.fleet.support)
      .filter((xs: any) => Array.isArray(xs) && xs.length > 0)
  )
  poiFleets.push(normalSupportFleet)

  const bossSupportFleet = _.head(
    poiBattles.filter((b: any) => b.type === 'Boss')
      .map((b: any) => b.fleet.support)
      .filter((xs: any) => Array.isArray(xs) && xs.length > 0)
  )
  poiFleets.push(bossSupportFleet)

  const wData: any = {}
  const fstRecord = poiRecords[0]
  if (mapId !== 'pvp') {
    wData.name = `${fstRecord.desc} ${mapIdToStr(mapId)} (${fstRecord.time})`
  } else {
    wData.name = `${fstRecord.desc} (${fstRecord.time})`
  }

  const wFleetArr = poiFleets.map((poiFleetInp: any) => {
    if (!Array.isArray(poiFleetInp)) return []
    const poiFleet = _.compact(poiFleetInp)
    const convertShip = (poiShip: any) => {
      const mstId = poiShip.api_ship_id
      const level = poiShip.api_lv
      const luck = poiShip.api_lucky[0]
      const wEquipInfoArr = [0, 1, 2, 3, 'ex'].map(ind => {
        const e = ind === 'ex' ? poiShip.poi_slot_ex : poiShip.poi_slot[ind as number]
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

  const poiLbas = fstBattle.fleet.LBAC || []
  wData.name_airfields = poiLbas.map((x: any) => x.api_name)

  const wAirbase = [1, 2, 3].map(sqId => {
    const squadron = poiLbas[sqId - 1]
    if (!squadron || !Array.isArray(squadron.api_plane_info)) return []
    const convertEquip = (rawEquip: any) => {
      if (!rawEquip) return []
      const mstId = rawEquip.poi_slot.api_slotitem_id
      const ace = rawEquip.poi_slot.api_alv
      const imp = rawEquip.poi_slot.api_level
      return [mstId, _.isInteger(ace) ? ace : 0, _.isInteger(imp) ? imp : 0]
    }
    return squadron.api_plane_info.map(convertEquip)
  })

  wData.data = [...wFleetArr, wAirbase]
  return wData
}
