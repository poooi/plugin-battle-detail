{React, ReactBootstrap} = window

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

updatePacketWithFleetInfo = (packet, isCombined, isCarrier, sortieFleetID, combinedFleetID) ->
  return null if packet is null
  # Obtain fleet information. (Ship id and ship equipment.)
  # Empty slot is `null`.
  {_ships, _slotitems, _decks} = window
  obtainFleetInfo = (id, fleet, equipment) ->
    return unless typeof id == "number" and id >= 0
    for ship_id, i in _decks[id].api_ship
      fleet[i] = null
      continue unless ship = _ships[ship_id]
      fleet[i] = ship.api_ship_id
      equipment[i] = []
      for equip_id, j in ship.api_slot
        equipment[i][j] = null
        continue unless equip = _slotitems[equip_id]
        equipment[i][j] = equip.api_slotitem_id
      equipment[i].push if ship.api_slot_ex > 0 then ship.api_slot_ex else null
    return
  sortieFleet = []
  sortieEquipment = []
  combinedFleet = []
  combinedEquipment = []
  obtainFleetInfo sortieFleetID, sortieFleet, sortieEquipment
  obtainFleetInfo combinedFleetID, combinedFleet, combinedEquipment

  packet.poi_is_combined = isCombined   # 連合艦隊？
  packet.poi_is_carrier = isCarrier     # 空母機動部隊=true, 水上打撃部隊=false
  packet.poi_sortie_fleet = sortieFleet
  packet.poi_sortie_equipment = sortieEquipment
  packet.poi_combined_fleet = combinedFleet
  packet.poi_combined_equipment = combinedEquipment

  # TODO: Keep compatibility with version 1.0.0
  #       Please remove these after 2016 autumn event.
  packet.poi_is_water = !isCarrier

  return packet

updatePacketWithMetadata = (packet, path, timestamp, comment) ->
  return null if packet is null
  packet.poi_uri = path
  packet.poi_timestamp = timestamp
  packet.poi_comment = comment
  return packet

parseBattlePacket = (packet) ->
  isCombined = packet.poi_is_combined
  isCarrier = packet.poi_is_carrier
  uri = packet.poi_uri

  # TODO: Keep compatibility with version 1.0.0
  #       Please remove these after 2016 autumn event.
  if packet.poi_is_water? and not packet.poi_is_carrier?
    isCarrier = !packet.poi_is_water

  battleType = null
  # Normal Fleet
  if not isCombined
    switch uri
      # Battle, Air battle
      when '/kcsapi/api_req_sortie/battle', '/kcsapi/api_req_practice/battle', '/kcsapi/api_req_sortie/airbattle'
        battleType = 'normal'
        stageFlow = [StageType.AerialCombat, StageType.AerialCombat, StageType.Support, StageType.TorpedoSalvo, StageType.Shelling, StageType.Shelling, StageType.TorpedoSalvo, StageType.Shelling]
      # Night battle
      when '/kcsapi/api_req_battle_midnight/battle', '/kcsapi/api_req_practice/midnight_battle', '/kcsapi/api_req_battle_midnight/sp_midnight'
        battleType = 'night'
        stageFlow = [StageType.Shelling]
  # Carrier Task Force
  if isCombined and isCarrier
    switch uri
      # Battle, Air battle
      when '/kcsapi/api_req_combined_battle/battle', '/kcsapi/api_req_combined_battle/airbattle'
        battleType = 'carrier'
        stageFlow = [StageType.AerialCombat, StageType.AerialCombat, StageType.Support, StageType.TorpedoSalvo, StageType.Shelling, StageType.TorpedoSalvo, StageType.Shelling, StageType.Shelling, StageType.Shelling]
      # Night battle
      when '/kcsapi/api_req_combined_battle/midnight_battle'
        battleType = 'night'
        stageFlow = [StageType.Shelling]
  # Surface Task Force
  if isCombined and not isCarrier
    switch uri
      # Battle, Air battle
      when '/kcsapi/api_req_combined_battle/battle_water', '/kcsapi/api_req_combined_battle/airbattle'
        battleType = 'surface'
        stageFlow = [StageType.AerialCombat, StageType.AerialCombat, StageType.Support, StageType.TorpedoSalvo, StageType.Shelling, StageType.Shelling, StageType.Shelling, StageType.TorpedoSalvo, StageType.Shelling]
      # Night battle
      when '/kcsapi/api_req_combined_battle/midnight_battle'
        battleType = 'night'
        stageFlow = [StageType.Shelling]

  formedFlow = []
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
    isCarrier: false
    battleComment: ""
    # Battle Packets Management
    battlePackets: []
    battlePacketsNonce: 0
    ## Battle Detail related
    # type = normal    : Normal battle
    # type = night     : Only night battle
    # type = carrier   : Carrier Task Force (空母機動部隊)
    # type = surface   : Surface Task Force (水上打撃部隊)
    battleNonce: 0
    battleType: null
    battleFlow: []

  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    {$ships, _ships, _decks} = window
    {isCombined, isCarrier, battleComment, battlePackets, battlePacketsNonce, battleNonce, battleType, battleFlow} = @state
    isStateChanged = false

    # Combined Fleet Status
    switch path
      when '/kcsapi/api_port/port'
        switch body.api_combined_flag
          when 1  # 1=機動部隊
            isStateChanged = true
            isCombined = true
            isCarrier = true
          when 2  # 2=水上部隊
            isStateChanged = true
            isCombined = true
            isCarrier = false
          else
            isStateChanged = true
            isCombined = false
            isCarrier = false
      # Oh fuck. Someone sorties with No.3/4 fleet when having combined fleet. 
      when '/kcsapi/api_req_map/start'
        if isCombined and parseInt(postBody.api_deck_id) != 1
          isStateChanged = true
          isCombined = false
          isCarrier = false

    # Battle Comment
    switch path
      when '/kcsapi/api_req_map/start', '/kcsapi/api_req_map/next'
        isStateChanged = true
        sortie = __ "Sortie"
        mapArea = body.api_maparea_id
        mapCell = body.api_mapinfo_no
        mapSpot = body.api_no
        battleComment = "#{sortie} #{mapArea}-#{mapCell} (#{mapSpot})"
      when '/kcsapi/api_req_member/get_practice_enemyinfo'
        isStateChanged = true
        practice = __ "Pratice"
        name = body.api_nickname
        level = body.api_level
        battleComment = "#{practice} #{name} (Lv.#{level})"

    # Battle Packets Management
    isBattle = false
    timestamp = new Date().getTime()
    switch path
      # Normal fleet
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
          # Dont update packet metadata
          path = body.poi_uri
          timestamp = body.poi_timestamp
          battleComment = body.poi_comment
        isBattle = true
        isCombined = false
        sortieID = if body.api_dock_id? then body.api_dock_id - 1 else body.api_deck_id - 1
        combinedID = null
      when '/kcsapi/api_req_battle_midnight/sp_midnight'
        isBattle = true
        isCombined = false
        sortieID = body.api_deck_id - 1
        combinedID = null
      # Carrier Task Force
      when '/kcsapi/api_req_combined_battle/battle'
        isBattle = true
        isCombined = true
        isCarrier = true
        sortieID = body.api_deck_id - 1
        combinedID = 1
      # Surface Task Force
      when '/kcsapi/api_req_combined_battle/battle_water'
        isBattle = true
        isCombined = true
        isCarrier = false
        sortieID = body.api_deck_id - 1
        combinedID = 1
      # Combined fleet shared api
      when '/kcsapi/api_req_combined_battle/airbattle'
        isBattle = true
        isCombined = true
        isCarrier = isCarrier
        sortieID = body.api_deck_id - 1
        combinedID = 1
      when '/kcsapi/api_req_combined_battle/midnight_battle'
        if @state.battlePackets[0]?
          oldBody = @state.battlePackets.shift()
          oldBody.api_hougeki = body.api_hougeki
          body = oldBody
          # Dont update packet metadata
          path = body.poi_uri
          timestamp = body.poi_timestamp
          battleComment = body.poi_comment
        isBattle = true
        isCombined = true
        isCarrier = isCarrier
        sortieID = body.api_deck_id - 1
        combinedID = 1
      when '/kcsapi/api_req_combined_battle/sp_midnight'
        isBattle = true
        isCombined = true
        isCarrier = isCarrier
        sortieID = body.api_deck_id - 1
        combinedID = 1

    if isBattle
      isStateChanged = true
      updatePacketWithFleetInfo body, isCombined, isCarrier, sortieID, combinedID
      updatePacketWithMetadata body, path, timestamp, battleComment
      battlePackets.unshift body
      battlePacketsNonce = updateNonce battlePacketsNonce
      while battlePackets.length > 40
        battlePackets.pop()
      # Render battle packet
      if @shouldAutoShow
        {battleType, battleFlow} = parseBattlePacket body
        battleNonce = updateNonce battleNonce

    # Update State
    if isStateChanged
      @setState
        isCombined: isCombined
        isCarrier: isCarrier
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
    if value?
      @shouldAutoShow = value
    else
      @shouldAutoShow = !@shouldAutoShow

  # API for Component <OptionArea />
  updateBattleDetail: (packet) ->
    {battleNonce} = @state
    {battleType, battleFlow} = parseBattlePacket packet
    battleNonce = updateNonce battleNonce
    @setState
      battleNonce: battleNonce
      battleType: battleType
      battleFlow: battleFlow

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
