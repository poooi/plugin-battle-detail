"use strict"

{React, ReactBootstrap} = window
{Panel, ProgressBar} = ReactBootstrap

simulator = require '../lib/simulator'
{Ship, ShipOwner, Attack, AttackType, HitType, Stage, StageType} = simulator


simualteBattlePacket = (packet) ->
  return unless packet?

  isCombined = packet.poi_is_combined
  isCarrier = packet.poi_is_carrier

  stageFlow = null
  # Normal Fleet
  if isCombined is false
    stageFlow = [StageType.AerialCombat, StageType.AerialCombat, StageType.Support, StageType.TorpedoSalvo, StageType.Shelling, StageType.Shelling, StageType.TorpedoSalvo, StageType.Shelling]
    stageTitle = [
      "#{__ "Aerial Combat"}",
      "#{__ "Aerial Combat"}",
      "#{__ 'Expedition Supporting Fire'}",
      "#{__ 'Opening Torpedo Salvo'}",
      "#{__ 'Shelling'}",
      "#{__ 'Shelling'}",
      "#{__ 'Torpedo Salvo'}",
      "#{__ 'Night Combat'}"
    ]
  # Carrier Task Force
  if isCombined is true and isCarrier is true
    stageFlow = [StageType.AerialCombat, StageType.AerialCombat, StageType.Support, StageType.TorpedoSalvo, StageType.Shelling, StageType.TorpedoSalvo, StageType.Shelling, StageType.Shelling, StageType.Shelling]
    stageTitle = [
      "#{__ "Aerial Combat"}",
      "#{__ "Aerial Combat"}",
      "#{__ 'Expedition Supporting Fire'}",
      "#{__ 'Opening Torpedo Salvo'}",
      "#{__ 'Shelling'} - #{__ 'Escort Fleet'}",
      "#{__ 'Torpedo Salvo'}",
      "#{__ 'Shelling'} - #{__ 'Main Fleet'}",
      "#{__ 'Shelling'} - #{__ 'Main Fleet'}",
      "#{__ 'Night Combat'}"
    ]
  # Surface Task Force
  if isCombined is true and isCarrier is false
    stageFlow = [StageType.AerialCombat, StageType.AerialCombat, StageType.Support, StageType.TorpedoSalvo, StageType.Shelling, StageType.Shelling, StageType.Shelling, StageType.TorpedoSalvo, StageType.Shelling]
    stageTitle = [
      "#{__ "Aerial Combat"}",
      "#{__ "Aerial Combat"}",
      "#{__ 'Expedition Supporting Fire'}",
      "#{__ 'Opening Torpedo Salvo'}",
      "#{__ 'Shelling'} - #{__ 'Main Fleet'}",
      "#{__ 'Shelling'} - #{__ 'Main Fleet'}",
      "#{__ 'Shelling'} - #{__ 'Escort Fleet'}",
      "#{__ 'Torpedo Salvo'}",
      "#{__ 'Night Combat'}"
    ]

  formedFlow = []
  if stageFlow
    console.assert(stageFlow.length == stageTitle.length, "`stageFlow` and `stageTitle` have different length!")
    try
      battleFlow = simulator.simulate(packet)
      for battle in battleFlow
        if stageFlow.length > 0 and stageFlow[0] == battle.type
          stageFlow.shift()
          battle.title = stageTitle.shift()
          formedFlow.push battle
    catch err
      console.error(err)
      return

  return formedFlow


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
    {max, from, to, damage, item} = @props
    to = 0 if to < 0
    from = max if from > max

    now = 100 * to / max
    lost = 100 * (from - to) / max
    labels = []
    labels.push <span key={0}>{"#{to} / #{max}"}</span>
    if damage > 0
      labels.push <span key={10}>{" (-#{damage}"}</span>
      if item in [42, 43]
        labels.push <span key={20}>{", "}</span>
        labels.push <img key={21} className="damage-control"></img>
      labels.push <span key={11}>{")"}</span>
    label = <span>{labels}</span>

    <ProgressBar className="hp-bar">
      <ProgressBar className="hp-bar" bsStyle={getHpStyle now} now={now} label={label} />
      <ProgressBar className="hp-bar lost" now={lost} />
    </ProgressBar>


ShipInfo = React.createClass
  render: ->
    {ship} = @props
    if not ship?
      return <span />

    $ship = window.$ships[ship.id]
    name = "?"
    if $ship?
      name = __r $ship.api_name
      name += $ship.api_yomi if $ship.api_yomi in ['elite', 'flagship']
    position = ship.position
    <span>
      <span>{name}</span>
      <span className="position-indicator">{"(#{position})"}</span>
    </span>


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
    {type, fromShip, toShip, maxHP, fromHP, toHP, damage, hit, useItem} = @props.attack
    totalDamage = damage.reduce ((p, x) -> p + x)
    # Is enemy attack?
    if toShip.owner is ShipOwner.Ours
      <div className={"attack-table-row"}>
        <span><HpBar max={maxHP} from={fromHP} to={toHP} damage={totalDamage} item={useItem} /></span>
        <span><ShipInfo ship={toShip} /></span>
        <span><FontAwesome name='long-arrow-left' /></span>
        <span><DamageInfo type={type} damage={damage} hit={hit} /></span>
        <span></span>
        <span><ShipInfo ship={fromShip} /></span>
        <span></span>
      </div>
    else
      <div className={"attack-table-row"}>
        <span></span>
        <span><ShipInfo ship={fromShip} /></span>
        <span></span>
        <span><DamageInfo type={type} damage={damage} hit={hit} /></span>
        <span><FontAwesome name='long-arrow-right' /></span>
        <span><ShipInfo ship={toShip} /></span>
        <span><HpBar max={maxHP} from={fromHP} to={toHP} damage={totalDamage} item={useItem} /></span>
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
    stages = simualteBattlePacket @props.battlePacket

    <div className="battle-detail-area">
      <Panel header={__ "Battle Detail"}>
      {
        if stages
          tables = []
          for stage, i in stages
            tables.push <AttackTable key={i} title={stage.title} attacks={stage.detail} />
          tables
        else
          __ "No battle"
      }
      </Panel>
    </div>

module.exports = BattleDetailArea
