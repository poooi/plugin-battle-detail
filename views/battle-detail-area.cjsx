{React, ReactBootstrap} = window
{Panel, ProgressBar} = ReactBootstrap
{Ship, ShipOwner, Attack, AttackType, HitType, Stage, StageType} = require '../lib/common'
simulator = require '../lib/simulate'


## simualteBattlePacket
# battleType = normal    : Normal battle
# battleType = night     : Only night battle
# battleType = carrier   : Carrier Task Force (空母機動部隊)
# battleType = surface   : Surface Task Force (水上打撃部隊)
simualteBattlePacket = (packet) ->
  if not packet?
    return result =
      battleType: null
      battleFlow: []

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
    try
      battleFlow = simulator.simulate(packet)
      for stage in stageFlow
        if battleFlow.length > 0 and battleFlow[0].type is stage
          formedFlow.push battleFlow.shift()
        else
          formedFlow.push null

  return result =
    battleType: battleType
    battleFlow: formedFlow


getHpStyle = (percent) ->
  if percent <= 25
    'danger'
  else if percent <= 50
    'warning'
  else if percent <= 75
    'info'
  else
    'success'

getAttackTypeName = (type) ->
  switch type
    when AttackType.Normal    # 通常攻撃
      __ "AT.Normal"
    when AttackType.Double    # 連撃
      __ "AT.Double"
    when AttackType.Primary_Secondary_CI  # カットイン(主砲/副砲)
      __ "AT.Primary_Secondary_CI"
    when AttackType.Primary_Radar_CI    # カットイン(主砲/電探)
      __ "AT.Primary_Radar_CI"
    when AttackType.Primary_AP_CI       # カットイン(主砲/徹甲)
      __ "AT.Primary_AP_CI"
    when AttackType.Primary_Primary_CI  # カットイン(主砲/主砲)
      __ "AT.Primary_Primary_CI"
    when AttackType.Primary_Torpedo_CI  # カットイン(主砲/魚雷)
      __ "AT.Primary_Torpedo_CI"
    when AttackType.Torpedo_Torpedo_CI  # カットイン(魚雷/魚雷)
      __ "AT.Torpedo_Torpedo_CI"
    else
      "#{type}?"


HpBar = React.createClass
  render: ->
    {max, now, detla} = @props
    now = 0 if now < 0
    percent = 100 * now / max
    if detla > 0
      label = "#{now} / #{max} (-#{detla})"
    else
      label = "#{now} / #{max}"
    <ProgressBar className="hp-bar" bsStyle={getHpStyle percent} now={percent} label={label} />


DamageInfo = React.createClass
  render: ->
    <span>
    {
      elements = []
      elements.push <span key={-1}>{getAttackTypeName @props.type}</span>
      elements.push <span key={-2}>{" ("}</span>
      for damage, i in @props.damage
        style = null
        if @props.hit[i] == HitType.Miss
          damage = "miss"
        if @props.hit[i] == HitType.Critical
          style = {color: "#FFFF00"}
        elements.push <span key={10 * i + 1} style={style}>{damage}</span>
        elements.push <span key={10 * i + 2}>{", "}</span>
      elements.pop()  # Remove last comma
      elements.push <span key={-3}>{")"}</span>
      elements
    }
    </span>


AttackTableRow = React.createClass
  render: ->
    getShipName = (shipObj) ->
      return "" if shipObj is null
      name = []
      ship = $ships[shipObj.id]
      if ship?
        if ship.api_yomi in ['elite', 'flagship']
          name.push ship.api_name + ship.api_yomi
        else
          name.push ship.api_name
      name.push "(#{shipObj.position})"
      name.join " "

    {_ships, $ships} = window
    {type, fromShip, toShip, maxHP, nowHP, damage, hit, useItem} = @props.attack
    fromShipName = getShipName fromShip
    toShipName = getShipName toShip
    totalDamage = damage.reduce ((p, x) -> p + x)
    # Is enemy attack?
    if toShip.owner is ShipOwner.Ours
      <div style={display: "flex"} className={"attack-table-row"}>
        <span style={flex: 6}><HpBar max={maxHP} now={nowHP} detla={totalDamage} /></span>
        <span style={flex: 6}>{toShipName}</span>
        <span style={flex: 1}>←</span>
        <span style={flex: 6}><DamageInfo type={type} damage={damage} hit={hit} /></span>
        <span style={flex: 1}></span>
        <span style={flex: 6}>{fromShipName}</span>
        <span style={flex: 6}></span>
      </div>
    else
      <div style={display: "flex"} className={"attack-table-row"}>
        <span style={flex: 6}></span>
        <span style={flex: 6}>{fromShipName}</span>
        <span style={flex: 1}></span>
        <span style={flex: 6}><DamageInfo type={type} damage={damage} hit={hit} /></span>
        <span style={flex: 1}>→</span>
        <span style={flex: 6}>{toShipName}</span>
        <span style={flex: 6}><HpBar max={maxHP} now={nowHP} detla={totalDamage} /></span>
      </div>


AttackTable = React.createClass
  render: ->
    if @props.attacks and @props.attacks.length > 0
      <div className={"attack-table"} style={width: "100%"}>
        <div className={"attack-table-title"} style={display: "flex"}>
        {
          if @props.title
            @props.title
        }
        </div>
        <div>
        {
          for attack, i in @props.attacks
            <AttackTableRow key={i} attack={attack} />
        }
        </div>
        <hr />
      </div>
    else
      <div />


BattleDetailArea = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    return false if @props.battleNonce == nextProps.battleNonce
    return true

  render: ->
    {battleType, battleFlow} = simualteBattlePacket @props.battlePacket
    switch battleType
      when 'normal'
        titles = [
          "#{__ "Aerial Combat"} - Stage 3",
          "#{__ "Aerial Combat"} - Stage 3",
          "#{__ 'Expedition Supporting Fire'}",
          "#{__ 'Opening Torpedo Salvo'}",
          "#{__ 'Shelling'}",
          "#{__ 'Shelling'}",
          "#{__ 'Torpedo Salvo'}",
          "#{__ 'Night Combat'}"
        ]
      when 'carrier'
        titles = [
          "#{__ "Aerial Combat"} - Stage 3",
          "#{__ "Aerial Combat"} - Stage 3",
          "#{__ 'Expedition Supporting Fire'}",
          "#{__ 'Opening Torpedo Salvo'}",
          "#{__ 'Shelling'} - #{__ 'Escort Fleet'}",
          "#{__ 'Torpedo Salvo'}",
          "#{__ 'Shelling'} - #{__ 'Main Fleet'}",
          "#{__ 'Shelling'} - #{__ 'Main Fleet'}",
          "#{__ 'Night Combat'}"
        ]
      when 'surface'
        titles = [
          "#{__ "Aerial Combat"} - Stage 3",
          "#{__ "Aerial Combat"} - Stage 3",
          "#{__ 'Expedition Supporting Fire'}",
          "#{__ 'Opening Torpedo Salvo'}",
          "#{__ 'Shelling'} - #{__ 'Main Fleet'}",
          "#{__ 'Shelling'} - #{__ 'Main Fleet'}",
          "#{__ 'Shelling'} - #{__ 'Escort Fleet'}",
          "#{__ 'Torpedo Salvo'}",
          "#{__ 'Night Combat'}"
        ]
      when 'night'
        titles = [
          "#{__ 'Night Combat'}"
        ]
      else
        titles = null

    <div className="battle-detail-area">
      <Panel header={__ "Battle Detail"}>
      {
        if titles
          tables = []
          for title, i in titles
            tables.push <AttackTable key={i} title={title} attacks={battleFlow[i]?.detail} />
          tables
        else
          __ "No battle"
      }
      </Panel>
    </div>

module.exports = BattleDetailArea
