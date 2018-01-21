import _ from 'lodash'
import { mapIdToStr } from 'subtender/kc'
import AppData from 'lib/appdata'

/*
   input structure (poiReplayGroup) is either a battle record,
   or an Array of battle records sorted in the order they happened.

 */
const convertReplay = async sortieIndexes => {
  const {
    indexes: poiRecords,
    mapId,
  } = sortieIndexes

  if (poiRecords.length === 0)
    throw new Error('cannot convert an empty record')

  // starting for this line poiRecords cannot be empty.
  const poiBattles = await Promise.all(
    poiRecords.map(r => AppData.loadBattle(r.id, false))
  )

  // console.log(sortieIndexes, poiBattles)
  const fstRecord = poiRecords[0]
  const fstBattle = poiBattles[0]

  // there's a typo in battle-details that 'Pratice' is used instead of 'Practice'
  const isPvP =
    fstBattle.type === 'Practice' || fstBattle.type === 'Pratice'

  if (poiRecords.length > 1) {
    if (isPvP)
      console.warn('PvP record should contain exactly one battle')
    // mapStr should be exactly the same
    const mapStrs = _.uniq(poiRecords.map(r => r.mapStr))
    if (mapStrs.length !== 1)
      console.warn('mapStr is not unique')
    if (mapStrs[0] === '')
      console.warn('expecting mapStr to be non-empty')
  }

  let whichMap
  if (sortieIndexes.mapId === 'pvp') {
    whichMap = {world: 0, mapnum: 0}
  } else {
    const world = Math.floor(mapId/10)
    const mapnum = mapId % 10
    whichMap = {world, mapnum}
  }

  const combined = fstBattle.fleet.type

  /*
     because battle records in poi does not record
     info of all fleets, let's fix fleet3 to always be normal support
     and fleet4 boss support
   */
  const support1 = 3
  const support2 = 4
  const transformFleet = fleetPoi => {
    if (!fleetPoi)
      return []

    const transformShip = ship => {
      if (!ship)
        return false
      // api_slot has 5 elements while we just need the first 4 of them.
      const normalSlots = [0,1,2,3].map(slotInd =>
        _.get(ship.poi_slot,slotInd)
      )
      const slots = [...normalSlots, ship.poi_slot_ex]
      return {
        mst_id: ship.api_ship_id,
        level: ship.api_lv,
        kyouka: ship.api_kyouka,
        morale: ship.api_cond,
        equip: slots.map(eqp => _.get(eqp, 'api_slotitem_id',0)),
        stars: slots.map(eqp => _.get(eqp, 'api_level',0)),
        ace: slots.map(eqp => _.get(eqp, 'api_alv', -1)),
      }
    }
    return _.compact(fleetPoi.map(transformShip))
  }

  const fleet1 = transformFleet(fstBattle.fleet.main)
  const fleet2 = transformFleet(fstBattle.fleet.escort)
  // for support expeditions, we just use the first valid fleet info.
  const fleet3 = transformFleet(
    // take first
    _.head(
      poiBattles.filter(
        // only normal supports
        b => b.type === 'Normal'
      ).map(
        b => b.fleet.support
      ).filter(xs =>
        Array.isArray(xs) && xs.length > 0
      )
    )
  )

  const fleet4 = transformFleet(
    // take first
    _.head(
      poiBattles.filter(
        // only boss support (should be <= 1)
        b => b.type === 'Boss'
      ).map(
        b => b.fleet.support
      ).filter(xs =>
        Array.isArray(xs) && xs.length > 0
      )
    )
  )

  const transformLbas = lbasPoi => {
    if (!lbasPoi)
      return {}
    const transformSquadron = sq => {
      const planes = sq.api_plane_info.map(p => {
        const slot = p.poi_slot
        if (!slot)
          return null
        return {
          mst_id: slot.api_slotitem_id,
          count: p.api_count,
          stars: _.get(p,'api_level',0),
          ace: slot.api_alv,
          state: p.api_state,
          morale: p.api_cond,
        }
      })
      return {
        rid: sq.api_rid,
        range: sq.api_distance,
        action: sq.api_action_kind,
        planes,
      }
    }
    return lbasPoi.map(transformSquadron)
  }

  const transformBattle = battlePoi => {
    const node = battlePoi.map[2]
    // TODO: might need _resultPackets for map-HP
    const [battlePackets, _resultPackets] = _.partition(
      battlePoi.packet,
      p =>
        p.poi_path.indexOf('battle_result') === -1 &&
        p.poi_path.indexOf('battleresult') === -1
    )

    const [dayBattles,nightBattles] = _.partition(
      battlePackets,
      /*
         api_midnight_flag is intended for indicating
         whether we are allowed to proceed into yasen following
         a day battle. here we check the presense of this flag
         to determine whether this is a day battle
         (since only day battle contains it)
       */
      p => 'api_midnight_flag' in p
    )
    const data = dayBattles[0] || {}
    const yasen = nightBattles[0] || {}
    return {node, data, yasen}
  }

  const lbas = transformLbas(fstBattle.fleet.LBAC)
  const battles = poiBattles.map(transformBattle)

  const replayData = {
    ...whichMap,
    fleetnum: 1,
    combined,
    support1, support2,
    fleet1, fleet2, fleet3, fleet4,
    lbas,
    battles,
  }

  let imageInfo

  {
    const desc =
      isPvP ?
        fstRecord.desc :
        `${fstRecord.desc} ${mapIdToStr(mapId)}`

    const timeStrs =
      poiRecords.length > 0 ?
        [fstRecord.time, _.last(poiRecords).time] :
        [fstRecord.time]


    const routes =
      isPvP ?
        [] :
        poiRecords.map((r,ind) => {
          const poiBattle = poiBattles[ind]
          const {type} = poiBattle
          if (!['Normal', 'Boss'].includes(type))
            console.warn(`unexpected record type: ${type}`)
          return {edge: r.route_, type}
        })

    const translateFleet = poiFleet => {
      if (_.isEmpty(poiFleet))
        return null
      const mstIds = poiFleet.map(x =>
        x && typeof x === 'object' && x.api_ship_id
      ).filter(x =>
        _.isInteger(x)
      )
      return mstIds.length > 0 ? mstIds : null
    }

    const fleets = _.compact(
      [fstBattle.fleet.main, fstBattle.fleet.escort].map(translateFleet)
    )

    imageInfo = {isPvP, desc, timeStrs, mapId, routes, fleets}
  }

  return {replayData, imageInfo}
}

export { convertReplay }
