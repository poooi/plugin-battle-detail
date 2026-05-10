import _ from 'lodash'
import AppData from './appdata'
import type { Battle, RawFleetShip, RawSlotItem } from 'poi-lib-battle'

export const convertToDeckBuilder = async (sortieIndexes: { indexes: Array<{ id: number }> }) => {
  const { indexes: poiRecords } = sortieIndexes

  if (poiRecords.length === 0) throw new Error('cannot convert an empty record')

  const poiBattles = (await Promise.all(
    poiRecords.map((r) => AppData.loadBattle(r.id, false)),
  )) as (Battle | null)[]

  const fstBattle = poiBattles[0]
  if (!fstBattle?.fleet) throw new Error('Battle data is incomplete')
  let poiFleets: Array<Array<RawFleetShip | null> | null | undefined> = []

  poiFleets.push(fstBattle.fleet.main)
  poiFleets.push(fstBattle.fleet.escort)

  const normalSupportFleet = _.head(
    poiBattles.filter((b) => b !== null && b.type === 'Normal')
      .map((b) => b!.fleet?.support)
      .filter((xs): xs is Array<RawFleetShip | null> => Array.isArray(xs) && xs.length > 0),
  )
  poiFleets.push(normalSupportFleet)

  const bossSupportFleet = _.head(
    poiBattles.filter((b) => b !== null && b.type === 'Boss')
      .map((b) => b!.fleet?.support)
      .filter((xs): xs is Array<RawFleetShip | null> => Array.isArray(xs) && xs.length > 0),
  )
  poiFleets.push(bossSupportFleet)

  if (poiFleets[0]?.length === 7) {
    if (Array.isArray(poiFleets[1])) {
      console.warn('striking force should not have escort fleet')
    }
    const [fMain, fEscort, fNSup, fBSup] = poiFleets
    poiFleets = [fEscort, fNSup, fMain, fBSup]
  }

  const dFleetPairs = poiFleets.map((poiFleet, fleetInd: number) => {
    if (!Array.isArray(poiFleet) || poiFleet.length === 0)
      return [`f${fleetInd + 1}`, {}]

    const transformShipM = (ship: RawFleetShip | null, shipInd: number) => {
      if (!ship) return []
      const items: Record<string, { id: number; rf?: number; mas?: number }> = {}

      _.map(ship.poi_slot, (item: RawSlotItem | null, itemInd: number) => {
        if (!item) return
        const itemObj: { id: number; rf?: number; mas?: number } = { id: item.api_slotitem_id }
        if (_.isInteger(item.api_level)) itemObj.rf = item.api_level
        if (_.isInteger(item.api_alv)) itemObj.mas = item.api_alv
        items[`i${itemInd + 1}`] = itemObj
      })

      if (ship.poi_slot_ex) {
        // poi-lib-battle incorrectly types poi_slot_ex as Array; it is actually a single item
        const item = ship.poi_slot_ex as unknown as RawSlotItem
        const itemObj: { id: number; rf?: number; mas?: number } = { id: item.api_slotitem_id }
        if (_.isInteger(item.api_level)) itemObj.rf = item.api_level
        if (_.isInteger(item.api_alv)) itemObj.mas = item.api_alv
        if (ship.api_slotnum < 4) {
          items[`i${ship.api_slotnum + 1}`] = itemObj
        } else {
          items.ix = itemObj
        }
      }

      const shipObj = { id: ship.api_ship_id, lv: ship.api_lv, luck: ship.api_lucky[0], items }
      return [[`s${shipInd + 1}`, shipObj]]
    }

    const fleetObj = _.fromPairs(_.flatMap(poiFleet, transformShipM))
    return [`f${fleetInd + 1}`, fleetObj]
  })

  return { version: 4, ..._.fromPairs(dFleetPairs) }
}
