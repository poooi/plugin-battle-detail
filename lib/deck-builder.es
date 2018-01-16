import _ from 'lodash'
import AppData from 'lib/appdata'

const convertToDeckBuilder = async sortieIndexes => {
  const {
    indexes: poiRecords,
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

  // here we expect to at least have poiFleets[0] available,
  // which is the main sortieing fleet.
  if (poiFleets[0].length === 7) {
    if (Array.isArray(poiFleets[1])) {
      console.warn('striking force should not have escort fleet')
    }
    const [fMain, fEscort, fNSup,fBSup] = poiFleets
    poiFleets = [fEscort, fNSup, fMain, fBSup]
  }

  const dFleetPairs = poiFleets.map((poiFleet, fleetInd) => {
    if (!Array.isArray(poiFleet) || poiFleet.length === 0)
      return [`f${fleetInd+1}`, {}]

    const transformShipM = (ship, shipInd) => {
      if (!ship)
        return []

      const items = {}

      // map for effect.
      _.map(ship.poi_slot, (item, itemInd) => {
        if (!item)
          return
        const itemObj = {id: item.api_slotitem_id}
        if (_.isInteger(item.api_level))
          itemObj.rf = item.api_level
        if (_.isInteger(item.api_alv))
          itemObj.mas = item.api_alv

        items[`i${itemInd+1}`] = itemObj
      })

      if (ship.poi_slot_ex) {
        const item = ship.poi_slot_ex
        const itemObj = {id: item.api_slotitem_id}
        if (_.isInteger(item.api_level))
          itemObj.rf = item.api_level
        if (_.isInteger(item.api_alv))
          itemObj.mas = item.api_alv

        /*
           NOTE: this doesn't seem to be mentioned anywhere,
           but when a ship has less than 4 free slots, "ix" should not be used.
           Instead we should use "i{ind}" (where ind is the index of first unavailable slot).
         */
        if (ship.api_slotnum < 4) {
          items[`i${ship.api_slotnum + 1}`] = itemObj
        } else {
          items.ix = itemObj
        }
      }

      const shipObj = {
        id: ship.api_ship_id,
        lv: ship.api_lv,
        luck: ship.api_lucky[0],
        items,
      }

      return [[`s${shipInd+1}`, shipObj]]
    }

    const fleetObj = _.fromPairs(
      _.flatMap(poiFleet, transformShipM)
    )

    return [`f${fleetInd+1}`, fleetObj]
  })

  return {
    version: 4,
    ..._.fromPairs(dFleetPairs),
  }
}

export { convertToDeckBuilder }
