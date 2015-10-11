{React, ReactBootstrap} = window
{Grid, TabbedArea, TabPane} = ReactBootstrap

simulater = require '../lib/simulate'
{Ship, ShipOwner, Attack, AttackType, Stage, StageType} = require '../lib/common'
AttackTable = require './attack-table'


updateBattlePacket = (packet, isCombined, isWater, isNight, sortieFleetID, combinedFleetID) ->
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
  packet.poi_is_night = isNight         # 夜戦？
  packet.poi_sortie_fleet = sortieFleet
  packet.poi_sortie_equipment = sortieEquipment
  packet.poi_combined_fleet = combinedFleet
  packet.poi_combined_equipment = combinedEquipment
  return packet

parseBattleFlow = (battleFlow, isCombined, isWater) ->
  return null unless battleFlow?
  if !isCombined  # Normal fleet
    stageFlow = [StageType.Kouku, StageType.Raigeki, StageType.Hougeki, StageType.Hougeki, StageType.Raigeki]
  else if isWater
    stageFlow = []
  else
    stageFlow = []

  formedFlow = []
  for stage in stageFlow
    if battleFlow.length > 0 and battleFlow[0].type is stage
      formedFlow.push battleFlow.shift()
    else
      formedFlow.push null
  return formedFlow

BattleDetailArea = React.createClass
  getInitialState: ->
    flow: []

  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse

  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    switch path
      when '/kcsapi/api_req_sortie/battle'
        {$ships, _ships, _decks} = window
        # TODO: Not support combined fleet
        isCombined = false
        isWater = false
        sortieID = body.api_dock_id - 1
        combinedID = null

        updateBattlePacket body, isCombined, isWater, false, sortieID, combinedID
        battleFlow = simulater.simulate(body)
        formedFlow = parseBattleFlow battleFlow, isCombined, isWater

        console.log(body)
        console.log(formedFlow)
        @setState
          flow: formedFlow

  render: ->
    <div>
      <TabbedArea defaultActiveKey={3} animation={false} style={display:"flex"}>
        <TabPane eventKey={1} tab="Opening Stages">
          <AttackTable title={"Aerial Combat - Stage 3"} attacks={@state.flow[0]?.detail} />
          <AttackTable title={"Expedition Supporting Fire"} attacks={null} />
          <AttackTable title={"Opening Torpedo Salvo"} attacks={@state.flow[1]?.detail} />
        </TabPane>
        <TabPane eventKey={3} tab="Shelling">
          <AttackTable title={"Shelling, 1st Round"} attacks={@state.flow[2]?.detail} />
          <AttackTable title={"Shelling, 2nd Round"} attacks={@state.flow[3]?.detail} />
        </TabPane>
        <TabPane eventKey={2} tab="Closing Stages">
          <AttackTable title={"Closing Torpedo Salvo"} attacks={@state.flow[4]?.detail} />
        </TabPane>
        <TabPane eventKey={4} tab="Night Combat">
          <p>Night Combat</p>
        </TabPane>
        <TabPane eventKey={5} tab="Misc">
          <p>Expedition Supporting Fire</p>
        </TabPane>
      </TabbedArea>
    </div>

React.render <BattleDetailArea />, $('battle-detail-area')
