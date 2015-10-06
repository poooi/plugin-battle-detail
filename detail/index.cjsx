{React, ReactBootstrap} = window
{Grid, TabbedArea, TabPane} = ReactBootstrap

simulater = require '../lib/simulate'
{Ship, ShipOwner, Attack, AttackType, Stage, StageType} = require '../lib/common'
AttackTable = require './attack-table'


BattleDetailArea = React.createClass
  # getInitialState: ->
  #   null
  # componentDidMount: ->
  #   window.addEventListener 'game.response', @handleResponse
  # componentWillUnmount: ->
  #   window.removeEventListener 'game.response', @handleResponse

  # handleResponse: (e) ->
  #   {method, path, body, postBody} = e.detail
  #   switch path
  #     when '/kcsapi/api_req_sortie/battle'

  render: ->
    attack = new Attack(
      type=AttackType.Double,
      fromShip=new Ship(ShipOwner.Ours, 69, null),
      toShip=new Ship(ShipOwner.Enemy, 560, null),
      maxHP=120,
      nowHP=116,
      damage=[18, 89],
      isCritical=[false, true]
      )
    <div>
      <Grid>
      <TabbedArea defaultActiveKey={1} animation={false}>
        <TabPane eventKey={1} tab="Aerial Combat">
          <AttackTable attacks={[attack]} />
          <p>Stage 1</p>
          <p>Stage 2</p>
          <p>Stage 3</p>
        </TabPane>
        <TabPane eventKey={2} tab="Torpedo Salvo">
          <p>Opening Torpedo Salvo</p>
          <p>Closing Torpedo Salvo</p>
        </TabPane>
        <TabPane eventKey={3} tab="Shelling">
          <p>Shelling, 1st Round</p>
          <p>Shelling, 2nd Round</p>
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
