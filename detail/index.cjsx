{React, ReactBootstrap} = window
{Grid, TabbedArea, TabPane} = ReactBootstrap

simulater = require '../lib/simulate'
{Ship, ShipOwner, Attack, AttackType, Stage, StageType} = require '../lib/common'
ModalArea = require './modal-area'
OptionArea = require './option-area'
BattleDetailArea = require './battle-detail-area'


updateNonce = (nonce) ->
  if typeof nonce == "number" and nonce > 0
    return nonce += 1
  else
    return 1

updatePacketWithFleetInfo = (packet, isCombined, isWater, sortieFleetID, combinedFleetID) ->
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

  packet.poi_is_combined = isCombined   # 連合艦隊？
  packet.poi_is_water = isWater         # 水上打撃部隊=true, 空母機動部隊=false
  packet.poi_sortie_fleet = sortieFleet
  packet.poi_sortie_equipment = sortieEquipment
  packet.poi_combined_fleet = combinedFleet
  packet.poi_combined_equipment = combinedEquipment
  return packet

updatePacketWithMetadata = (packet, path, timestamp, comment) ->
  return null if packet is null
  packet.poi_uri = path
  packet.poi_timestamp = timestamp
  packet.poi_comment = comment
  return packet

parseBattleFlow = (packet) ->
  battleType = null
  formedFlow = []
  switch packet?.poi_uri
    when '/kcsapi/api_req_sortie/battle', '/kcsapi/api_req_practice/battle', '/kcsapi/api_req_sortie/airbattle'
      battleType = 'normal'
      stageFlow = [StageType.Kouku, StageType.Kouku, StageType.Support, StageType.Raigeki, StageType.Hougeki, StageType.Hougeki, StageType.Raigeki, StageType.Hougeki]
    when '/kcsapi/api_req_battle_midnight/battle', '/kcsapi/api_req_practice/midnight_battle', '/kcsapi/api_req_battle_midnight/sp_midnight'
      battleType = 'night'
      stageFlow = [StageType.Hougeki]
  if battleType
    battleFlow = simulater.simulate(packet)
    for stage in stageFlow
      if battleFlow.length > 0 and battleFlow[0].type is stage
        formedFlow.push battleFlow.shift()
      else
        formedFlow.push null
  return result =
    battleType: battleType
    battleFlow: formedFlow

MainArea = React.createClass
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse

  getInitialState: ->
    # Game states
    isCombined: false
    isWater: false
    battleComment: ""
    # Battle Packets Management
    battlePackets: []
    battlePacketsNonce: 0
    ## Battle Detail related
    # type = normal    : Normal battle
    # type = night     : Only night battle
    # type = combined1 : 水上打撃部隊
    # type = combined2 : 空母機動部隊
    battleNonce: 0
    battleType: null
    battleFlow: []

  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    {$ships, _ships, _decks} = window
    {isCombined, isWater, battleComment, battlePackets, battlePacketsNonce, battleNonce, battleType, battleFlow} = @state

    # Game states
    switch path
      when '/kcsapi/api_req_map/start', '/kcsapi/api_req_map/next'
        sortie = __ "Sortie"
        mapArea = body.api_maparea_id
        mapCell = body.api_mapinfo_no
        mapSpot = body.api_no
        battleComment = "#{sortie} #{mapArea}-#{mapCell} (#{mapSpot})"
      when '/kcsapi/api_req_member/get_practice_enemyinfo'
        practice = __ "Pratice"
        name = body.api_nickname
        level = body.api_level
        battleComment = "#{practice} #{name} (Lv.#{level})"

    # Battle Packets Management
    isBattle = false
    packet = body
    timestamp = new Date().getTime()
    switch path
      when '/kcsapi/api_req_sortie/battle', '/kcsapi/api_req_practice/battle', '/kcsapi/api_req_sortie/airbattle'
        isBattle = true
        isCombined = false
        sortieID = body.api_dock_id - 1
        combinedID = null
      when '/kcsapi/api_req_battle_midnight/battle', '/kcsapi/api_req_practice/midnight_battle'
        if @state.battlePackets[0]?
          oldBody = @state.battlePackets.shift()
          oldBody.api_hougeki = body.api_hougeki
          body = oldBody
          isBattle = true
          isCombined = false
          sortieID = body.api_dock_id - 1
          combinedID = null
          # Dont update packet metadata and fleet info
          path = body.poi_uri
          timestamp = body.poi_timestamp
          battleComment = body.poi_comment
        else
          isBattle = true
          isCombined = false
          sortieID = body.api_deck_id - 1
          combinedID = null
      when '/kcsapi/api_req_battle_midnight/sp_midnight'
        isBattle = true
        isCombined = false
        sortieID = body.api_deck_id - 1
        combinedID = null

    if isBattle
      updatePacketWithFleetInfo body, isCombined, isWater, sortieID, combinedID
      updatePacketWithMetadata body, path, timestamp, battleComment
      battlePackets.unshift body
      battlePacketsNonce = updateNonce battlePacketsNonce
      while battlePackets.length > 40
        battlePackets.pop()
      # Render battle packet
      if @shouldAutoShow
        {battleType, battleFlow} = parseBattleFlow body
        battleNonce = updateNonce battleNonce

    @setState
      isCombined: isCombined
      isWater: isWater
      battleComment: battleComment
      battlePackets: battlePackets
      battlePacketsNonce: battlePacketsNonce
      battleNonce: battleNonce
      battleType: battleType
      battleFlow: battleFlow

  # API for Component <OptionArea />
  shouldAutoShow: true

  # API for Component <OptionArea />
  toggleAutoShow: (value) ->
    if value
      @shouldAutoShow = value
    else
      @shouldAutoShow = !@shouldAutoShow

  # API for Component <OptionArea />
  updateBattleDetail: (packet) ->
    {battleNonce} = @state
    {battleType, battleFlow} = parseBattleFlow packet
    battleNonce = updateNonce battleNonce
    @setState
      battleNonce: battleNonce
      battleType: battleType
      battleFlow: battleFlow

  # API for Component <OptionArea />
  importBattlePacket: (packet) ->
    # TODO

  render: ->
    <div className="main">
      <ModalArea />
      <OptionArea
        battlePackets={@state.battlePackets}
        battlePacketsNonce={@state.battlePacketsNonce}
        toggleAutoShow={@toggleAutoShow}
        updateBattleDetail={@updateBattleDetail}
        />
      <BattleDetailArea
        battleNonce={@state.battleNonce}
        battleType={@state.battleType}
        battleFlow={@state.battleFlow}
        />
    </div>

React.render <MainArea />, $('main')
