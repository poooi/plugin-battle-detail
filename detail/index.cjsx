{React, ReactBootstrap} = window
{Grid, TabbedArea, TabPane} = ReactBootstrap

simulater = require '../lib/simulate'
{Ship, ShipOwner, Attack, AttackType, Stage, StageType} = require '../lib/common'
AttackTable = require './attack-table'


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
    if battleFlow.length > 0 and battleFlow[0].name is stage
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
        sortieID = [-1, -1, -1, -1, -1, -1]
        combinedID = [-1, -1, -1, -1, -1, -1]
        for ship, i in _decks[body.api_dock_id - 1].api_ship
          if ship > 0
            sortieID[i] = _ships[ship]?.api_ship_id

        body.isCombined = isCombined
        body.isWater = isWater
        body.sortieID = sortieID
        body.combinedID = combinedID
        battleFlow = simulater.simulate(body)
        formedFlow = parseBattleFlow battleFlow, isCombined, isWater

        console.log(formedFlow)
        @setState
          flow: formedFlow

  render: ->
    <div>
      <Grid>
      <TabbedArea defaultActiveKey={3} animation={false}>
        <TabPane eventKey={1} tab="Aerial Combat">
          <AttackTable title={"Stage 3"} attacks={@state.flow[0]?.detail} />
        </TabPane>
        <TabPane eventKey={2} tab="Torpedo Salvo">
          <AttackTable title={"Opening Torpedo Salvo"} attacks={@state.flow[1]?.detail} />
          <AttackTable title={"Closing Torpedo Salvo"} attacks={@state.flow[4]?.detail} />
        </TabPane>
        <TabPane eventKey={3} tab="Shelling">
          <AttackTable title={"Shelling, 1st Round"} attacks={@state.flow[2]?.detail} />
          <AttackTable title={"Shelling, 2nd Round"} attacks={@state.flow[3]?.detail} />
        </TabPane>
        <TabPane eventKey={4} tab="Night Combat">
          <p>Night Combat</p>
        </TabPane>
        <TabPane eventKey={5} tab="Misc">
          <p>Expedition Supporting Fire</p>
        </TabPane>
      </TabbedArea>
      </Grid>
    </div>

React.render <BattleDetailArea />, $('battle-detail-area')
