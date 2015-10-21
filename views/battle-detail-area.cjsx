{React, ReactBootstrap} = window
{Panel, ProgressBar} = ReactBootstrap
{Ship, ShipOwner, Attack, AttackType, Stage, StageType} = require '../lib/common'


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
    if detla > now
      now = 0
      percent = 0
    else
      now -= detla
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
        if damage == 0
          damage = "miss"
        elements.push <span key={10*i + 1} style={if @props.isCritical[i] then color: "#FFFF00"}>{damage}</span>
        elements.push <span key={10*i + 2}>{", "}</span>
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
    {type, fromShip, toShip, maxHP, nowHP, damage, isCritical} = @props.attack
    fromShipName = getShipName fromShip
    toShipName = getShipName toShip
    totalDamage = damage.reduce ((p, x) -> p + x)
    # Is enemy attack?
    if toShip.owner is ShipOwner.Ours
      <div style={display: "flex"} className={"attack-table-row"}>
        <span style={flex: 6}><HpBar max={maxHP} now={nowHP} detla={totalDamage} /></span>
        <span style={flex: 6}>{toShipName}</span>
        <span style={flex: 1}>←</span>
        <span style={flex: 6}><DamageInfo type={type} damage={damage} isCritical={isCritical} /></span>
        <span style={flex: 1}></span>
        <span style={flex: 6}>{fromShipName}</span>
        <span style={flex: 6}></span>
      </div>
    else
      <div style={display: "flex"} className={"attack-table-row"}>
        <span style={flex: 6}></span>
        <span style={flex: 6}>{fromShipName}</span>
        <span style={flex: 1}></span>
        <span style={flex: 6}><DamageInfo type={type} damage={damage} isCritical={isCritical} /></span>
        <span style={flex: 1}>→</span>
        <span style={flex: 6}>{toShipName}</span>
        <span style={flex: 6}><HpBar max={maxHP} now={nowHP} detla={totalDamage} /></span>
      </div>


AttackTableHeader = React.createClass
  render: ->
    <div style={display: "flex"} className={"attack-table-row"}>
      <span style={flex: 6}>{'HP'}</span>
      <span style={flex: 6}>{'We'}</span>
      <span style={flex: 1}>{''}</span>
      <span style={flex: 6}>{'Attack'}</span>
      <span style={flex: 1}>{''}</span>
      <span style={flex: 6}>{'Enemy'}</span>
      <span style={flex: 6}>{'HP'}</span>
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
    <div className="battle-detail-area">
    {
      switch @props.battleType
        when 'normal'
          <Panel header={__ "Battle Detail"}>
            <AttackTable title={__("Aerial Combat") + " - Stage 3"} attacks={@props.battleFlow[0]?.detail} />
            <AttackTable title={__("Aerial Combat") + " - Stage 3"} attacks={@props.battleFlow[1]?.detail} />
            <AttackTable title={__ "Expedition Supporting Fire"} attacks={@props.battleFlow[2]?.detail} />
            <AttackTable title={__ "Opening Torpedo Salvo"} attacks={@props.battleFlow[3]?.detail} />
            <AttackTable title={__ "Shelling"} attacks={@props.battleFlow[4]?.detail} />
            <AttackTable title={__ "Shelling"} attacks={@props.battleFlow[5]?.detail} />
            <AttackTable title={__ "Torpedo Salvo"} attacks={@props.battleFlow[6]?.detail} />
            <AttackTable title={__ "Night Combat"} attacks={@props.battleFlow[7]?.detail} />
          </Panel>
        when 'night'
          <Panel header={__ "Battle Detail"}>
            <AttackTable title={__ "Night Combat"} attacks={@props.battleFlow[0]?.detail} />
          </Panel>
        else
          <Panel header={__ "Battle Detail"}>
            {__ "No battle"}
          </Panel>
      }
    </div>

module.exports = BattleDetailArea
