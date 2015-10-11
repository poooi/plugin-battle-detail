{React, ReactBootstrap} = window
{Grid, TabbedArea, TabPane} = ReactBootstrap

simulater = require '../lib/simulate'
{Ship, ShipOwner, Attack, AttackType, Stage, StageType} = require '../lib/common'
BattleInfoArea = require './battle-info-area'


updateBattlePacket = (packet, path, timestamp, isCombined, isWater, sortieFleetID, combinedFleetID) ->
  return null if packet is null
  # Obtain fleet information. (Ship id and ship equipment.)
  # Empty slot is `null`.
  {_ships, _slotitems, _decks} = window
  obtainFleetInfo = (id, fleet, equipment) ->
    return unless typeof id == "number" and id >= 0
    for ship, i in _decks[id].api_ship
      fleet[i] = null
      continue unless ship > 0
      fleet[i] = _ships[ship]?.api_ship_id
      equipment[i] = []
      for equip, j in _ships[ship]?.api_slot
        equipment[i][j] = null
        continue unless equip > 0
        equipment[i][j] = _slotitems[equip].api_slotitem_id
    return
  sortieFleet = []
  sortieEquipment = []
  combinedFleet = []
  combinedEquipment = []
  obtainFleetInfo sortieFleetID, sortieFleet, sortieEquipment
  obtainFleetInfo combinedFleetID, combinedFleet, combinedEquipment

  packet.poi_uri = path
  packet.poi_timestamp = timestamp
  packet.poi_is_combined = isCombined   # 連合艦隊？
  packet.poi_is_water = isWater         # 水上打撃部隊=true, 空母機動部隊=false
  packet.poi_sortie_fleet = sortieFleet
  packet.poi_sortie_equipment = sortieEquipment
  packet.poi_combined_fleet = combinedFleet
  packet.poi_combined_equipment = combinedEquipment
  return packet

parseBattleFlow = (battleFlow, stageFlow) ->
  return null unless battleFlow? and stageFlow?
  formedFlow = []
  for stage in stageFlow
    if battleFlow.length > 0 and battleFlow[0].type is stage
      formedFlow.push battleFlow.shift()
    else
      formedFlow.push null
  return formedFlow

BattleDetailArea = React.createClass
  getInitialState: ->
    isCombined: false
    isWater: false
    ## Battle
    # type = normal : Normal battle
    # type = night  : Only night battle
    # type = combined1 : 水上打撃部隊
    # type = combined2 : 空母機動部隊
    battleType: null
    battleFlow: []
    battlePacket: null

  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse

  shouldComponentUpdate: (nextProps, nextState) ->
    # Dont render when battle packat isnt changed.
    if @state.battlePacket? and nextState.battlePacket? and
       @state.battlePacket.poi_timestamp == nextState.battlePacket.poi_timestamp
      console.log("shouldComponentUpdate: battlePacket.poi_timestamp matched.")
      return false
    return true

  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    {$ships, _ships, _decks} = window
    timestamp = new Date().getTime()
    isBattle = false  # Flag of showing battle detail
    isCombined = @state.isCombined
    isWater = @state.isWater
    sortieID = null
    combinedID = null
    battleType = null

    switch path
      when '/kcsapi/api_req_sortie/battle', '/kcsapi/api_req_practice/battle', '/kcsapi/api_req_sortie/airbattle'
        isBattle = true
        isCombined = false
        battleType = 'normal'
        sortieID = body.api_dock_id - 1
        combinedID = null
      when '/kcsapi/api_req_battle_midnight/battle', '/kcsapi/api_req_practice/midnight_battle'
        oldBody = @state.battlePacket
        if oldBody?
          oldBody.api_hougeki = body.api_hougeki
          body = oldBody
          battleType = 'normal'
          sortieID = body.api_dock_id - 1
        else
          battleType = 'night'
          sortieID = body.api_deck_id - 1
        isBattle = true
        isCombined = false
        combinedID = null
      when '/kcsapi/api_req_battle_midnight/sp_midnight'
        isBattle = true
        isCombined = false
        battleType = 'night'
        sortieID = body.api_deck_id - 1
        combinedID = null

    if isBattle
      stageFlow = null
      switch battleType
        when 'normal'
          stageFlow = [StageType.Kouku, StageType.Kouku, StageType.Support, StageType.Raigeki, StageType.Hougeki, StageType.Hougeki, StageType.Raigeki, StageType.Hougeki]
        when 'night'
          stageFlow = [StageType.Hougeki]
      updateBattlePacket body, path, timestamp, isCombined, isWater, sortieID, combinedID
      battleFlow = simulater.simulate(body)
      formedFlow = parseBattleFlow battleFlow, stageFlow

      console.log(body)
      console.log(formedFlow)
      @setState
        battleType: battleType
        battleFlow: formedFlow
        battlePacket: body

  render: ->
    <div className="battle-detail-container">
      <BattleInfoArea
        battleType={@state.battleType}
        battleFlow={@state.battleFlow}
        />
    </div>

React.render <BattleDetailArea />, $('battle-detail-area')
