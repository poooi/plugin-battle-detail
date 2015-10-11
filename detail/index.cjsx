{React, ReactBootstrap} = window
{Grid, TabbedArea, TabPane} = ReactBootstrap

simulater = require '../lib/simulate'
{Ship, ShipOwner, Attack, AttackType, Stage, StageType} = require '../lib/common'
AttackTable = require './attack-table'


updateBattlePacket = (packet, path, isCombined, isWater, sortieFleetID, combinedFleetID) ->
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

  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    {$ships, _ships, _decks} = window
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
        else
          battleType = 'night'
        isBattle = true
        isCombined = false
        sortieID = body.api_deck_id - 1
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
          stageFlow = [StageType.Kouku, StageType.Kouku, StageType.Raigeki, StageType.Hougeki, StageType.Hougeki, StageType.Raigeki, StageType.Hougeki]
        when 'night'
          stageFlow = [StageType.Hougeki]
      updateBattlePacket body, path, isCombined, isWater, sortieID, combinedID
      battleFlow = simulater.simulate(body)
      formedFlow = parseBattleFlow battleFlow, stageFlow

      console.log(body)
      console.log(formedFlow)
      @setState
        battleType: battleType
        battleFlow: formedFlow
        battlePacket: body

  render: ->
    switch @state.battleType
      when 'normal'
        <div>
          <TabbedArea defaultActiveKey={1} animation={false} style={display:"flex"}>
            <TabPane eventKey={1} tab="Battle">
              <AttackTable title={"Aerial Combat, 1st - Stage 3"} attacks={@state.battleFlow[0]?.detail} />
              <AttackTable title={"Aerial Combat, 2nd - Stage 3"} attacks={@state.battleFlow[1]?.detail} />
              <AttackTable title={"Expedition Supporting Fire"} attacks={null} />
              <AttackTable title={"Opening Torpedo Salvo"} attacks={@state.battleFlow[2]?.detail} />
              <AttackTable title={"Shelling, 1st Round"} attacks={@state.battleFlow[3]?.detail} />
              <AttackTable title={"Shelling, 2nd Round"} attacks={@state.battleFlow[4]?.detail} />
              <AttackTable title={"Closing Torpedo Salvo"} attacks={@state.battleFlow[5]?.detail} />
              <AttackTable title={"Night Combat"} attacks={@state.battleFlow[6]?.detail} />
            </TabPane>
            <TabPane eventKey={99} tab="Setting">
              <p>Setting View</p>
            </TabPane>
          </TabbedArea>
        </div>
      when 'night'
        <div>
          <TabbedArea defaultActiveKey={1} animation={false} style={display:"flex"}>
            <TabPane eventKey={1} tab="Battle">
              <AttackTable title={"Night Combat"} attacks={@state.battleFlow[0]?.detail} />
            </TabPane>
            <TabPane eventKey={99} tab="Setting">
              <p>Setting View</p>
            </TabPane>
          </TabbedArea>
        </div>
      else
        <div>
          <TabbedArea defaultActiveKey={1} animation={false} style={display:"flex"}>
            <TabPane eventKey={1} tab="Battle">
              <p>No Battle</p>
            </TabPane>
            <TabPane eventKey={99} tab="Setting">
              <p>Setting View</p>
            </TabPane>
          </TabbedArea>
        </div>

React.render <BattleDetailArea />, $('battle-detail-area')
