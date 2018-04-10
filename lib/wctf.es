import _ from 'lodash'
import { mapIdToStr } from 'subtender/kc'
import AppData from 'lib/appdata'

const convertToWctf = async sortieIndexes => {
  const {
    indexes: poiRecords, mapId,
  } = sortieIndexes

  if (poiRecords.length === 0)
    throw new Error('cannot convert an empty record')

  // starting for this line poiRecords cannot be empty.
  const poiBattles = await Promise.all(
    poiRecords.map(r => AppData.loadBattle(r.id, false))
  )

  const fstBattle = poiBattles[0]

  let poiFleets = []

  // [0]
  poiFleets.push(fstBattle.fleet.main)
  // [1]
  poiFleets.push(fstBattle.fleet.escort)

  const normalSupportFleet = _.head(
    poiBattles.filter(
      // only normal supports
      b => b.type === 'Normal'
    ).map(
      b => b.fleet.support
    ).filter(xs =>
      Array.isArray(xs) && xs.length > 0
    )
  )
  // [2]
  poiFleets.push(normalSupportFleet)

  const bossSupportFleet = _.head(
    poiBattles.filter(
      // only boss support (should be <= 1)
      b => b.type === 'Boss'
    ).map(
      b => b.fleet.support
    ).filter(xs =>
      Array.isArray(xs) && xs.length > 0
    )
  )
  // [3]
  poiFleets.push(bossSupportFleet)

  const wData = {}
  const fstRecord = poiRecords[0]
  if (mapId !== 'pvp') {
    wData.name = `${fstRecord.desc} ${mapIdToStr(mapId)} (${fstRecord.time})`
  } else {
    wData.name = `${fstRecord.desc} (${fstRecord.time})`
  }

  const wFleetArr = poiFleets.map(poiFleetInp => {
    if (!Array.isArray(poiFleetInp))
      return []
    const poiFleet = _.compact(poiFleetInp)

    const convertShip = poiShip => {
      const mstId = poiShip.api_ship_id
      const level = poiShip.api_lv
      const luck = poiShip.api_lucky[0]

      const wEquipInfoArr =
        [0,1,2,3,'ex'].map(ind => {
          const e =
            ind === 'ex' ? poiShip.poi_slot_ex : poiShip.poi_slot[ind]
          if (!e)
            return null
          return {
            mstId: e.api_slotitem_id,
            imp: _.isInteger(e.api_level) ? e.api_level : null,
            ace: _.isInteger(e.api_alv) ? e.api_alv : null,
          }
        })

      return [
        mstId,
        [level,luck],
        // Array of mstId
        wEquipInfoArr.map(x => !x ? null : x.mstId),
        // Array of imp
        wEquipInfoArr.map(x => !x ? null : x.imp),
        // Array of ace
        wEquipInfoArr.map(x => !x ? null : x.ace),
      ]
    }
    return poiFleet.map(convertShip)
  })


  const poiLbas = fstBattle.fleet.LBAC || []
  wData.name_airfields = poiLbas.map(x => x.api_name)

  const wAirbase = [1,2,3].map(sqId => {
    const squadron = poiLbas[sqId-1]
    if (!squadron || !Array.isArray(squadron.api_plane_info))
      return []
    const convertEquip = rawEquip => {
      if (!rawEquip)
        return []
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

export { convertToWctf }
