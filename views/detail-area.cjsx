"use strict"

{React, ReactBootstrap} = window
{Panel, ProgressBar, OverlayTrigger, Tooltip, Row} = ReactBootstrap
{HPBar} = require('./bar')

{Models, Simulator} = require('lib/battle')
{Stage, StageType, Attack, AttackType, HitType, Ship, ShipOwner} = Models
{AirControl, Engagement, Formation, Detection} = Models

### Hack for poor coffeescript
AirControlName = {
  [AirControl.Parity      ]: __("Air Parity"),
  [AirControl.Supremacy   ]: __("Air Supremacy"),
  [AirControl.Superiority ]: __("Air Superiority"),
  [AirControl.Incapability]: __("Air Incapability"),
  [AirControl.Denial      ]: __("Air Denial"),
}

EngagementName = {
  [Engagement.Parallel     ]: __("Parallel Engagement"),
  [Engagement.Headon       ]: __("Head-on Engagement"),
  [Engagement.TAdvantage   ]: __("Crossing the T (Advantage)"),
  [Engagement.TDisadvantage]: __("Crossing the T (Disadvantage)"),
}

FormationName = {
  [Formation.Ahead  ]: __("Line Ahead"),
  [Formation.Double ]: __("Double Line"),
  [Formation.Diamond]: __("Diamond"),
  [Formation.Echelon]: __("Echelon"),
  [Formation.Abreast]: __("Line Abreast"),
  [Formation.CruisingAntiSub]: __("Cruising Formation 1 (anti-sub)"),
  [Formation.CruisingForward]: __("Cruising Formation 2 (forward)"),
  [Formation.CruisingDiamond]: __("Cruising Formation 3 (ring)"),
  [Formation.CruisingBattle ]: __("Cruising Formation 4 (battle)"),
}

DetectionName = {
  [Detection.Success  ]: __('Detection Success'),
  [Detection.SuccessNR]: __('Detection Success') + ' (' + __('not return') + ')',
  [Detection.SuccessNP]: __('Detection Success') + ' (' + __('without plane') + ')',
  [Detection.Failure  ]: __('Detection Failure'),
  [Detection.FailureNR]: __('Detection Failure') + ' (' + __('not return') + ')',
  [Detection.FailureNP]: __('Detection Failure') + ' (' + __('without plane') + ')',
}
###
AirControlName = {}
AirControlName[AirControl.Parity      ] = __("Air Parity")
AirControlName[AirControl.Supremacy   ] = __("Air Supremacy")
AirControlName[AirControl.Superiority ] = __("Air Superiority")
AirControlName[AirControl.Incapability] = __("Air Incapability")
AirControlName[AirControl.Denial      ] = __("Air Denial")

EngagementName = {}
EngagementName[Engagement.Parallel     ] = __("Parallel Engagement")
EngagementName[Engagement.Headon       ] = __("Head-on Engagement")
EngagementName[Engagement.TAdvantage   ] = __("Crossing the T (Advantage)")
EngagementName[Engagement.TDisadvantage] = __("Crossing the T (Disadvantage)")

FormationName = {}
FormationName[Formation.Ahead  ] = __("Line Ahead")
FormationName[Formation.Double ] = __("Double Line")
FormationName[Formation.Diamond] = __("Diamond")
FormationName[Formation.Echelon] = __("Echelon")
FormationName[Formation.Abreast] = __("Line Abreast")
FormationName[Formation.CruisingAntiSub] = __("Cruising Formation 1 (anti-sub)")
FormationName[Formation.CruisingForward] = __("Cruising Formation 2 (forward)")
FormationName[Formation.CruisingDiamond] = __("Cruising Formation 3 (ring)")
FormationName[Formation.CruisingBattle ] = __("Cruising Formation 4 (battle)")

DetectionName = {}
DetectionName[Detection.Success  ] = __('Detection Success')
DetectionName[Detection.SuccessNR] = __('Detection Success') + ' (' + __('not return') + ')'
DetectionName[Detection.SuccessNP] = __('Detection Success') + ' (' + __('without plane') + ')'
DetectionName[Detection.Failure  ] = __('Detection Failure')
DetectionName[Detection.FailureNR] = __('Detection Failure') + ' (' + __('not return') + ')'
DetectionName[Detection.FailureNP] = __('Detection Failure') + ' (' + __('without plane') + ')'


getAttackTypeName = (type) ->
  switch type
    when AttackType.Normal    # 通常攻撃
      __("AT.Normal")
    when AttackType.Double    # 連撃
      __("AT.Double")
    when AttackType.Primary_Secondary_CI  # カットイン(主砲/副砲)
      __("AT.Primary_Secondary_CI")
    when AttackType.Primary_Radar_CI    # カットイン(主砲/電探)
      __("AT.Primary_Radar_CI")
    when AttackType.Primary_AP_CI       # カットイン(主砲/徹甲)
      __("AT.Primary_AP_CI")
    when AttackType.Primary_Primary_CI  # カットイン(主砲/主砲)
      __("AT.Primary_Primary_CI")
    when AttackType.Primary_Torpedo_CI  # カットイン(主砲/魚雷)
      __("AT.Primary_Torpedo_CI")
    when AttackType.Torpedo_Torpedo_CI  # カットイン(魚雷/魚雷)
      __("AT.Torpedo_Torpedo_CI")
    else
      "#{type}?"

getShipName = (id) ->
  return '' unless id?
  return __r($ships[id]?.api_name)

getItemName = (id) ->
  return '' unless id?
  return __r($slotitems[id]?.api_name)


EngagementTable = React.createClass
  render: ->
    console.log('EngagementTable', @props.engagement)
    e = @props.engagement
    rows = []

    if e.engagement or e.fFormation or e.eFormation
      rows.push <Row className={"engagement-row"} key={1}>
        <span>{FormationName[e.fFormation]}</span>
        <span>{EngagementName[e.engagement]}</span>
        <span>{FormationName[e.eFormation]}</span>
      </Row>

    if e.fDetection or e.eDetection
      rows.push <Row className={"engagement-row"} key={2}>
        <span>{DetectionName[e.fDetection]}</span>
        <span></span>
        <span>{DetectionName[e.eDetection]}</span>
      </Row>

    if e.weakened
      rows.push <Row className={"engagement-row"} key={3}>
        <span></span>
        <span>{"#{__("Gimmick")}: #{e.weakened}"}</span>
        <span></span>
      </Row>

    if e.fContact or e.eContact
      rows.push <Row className={"engagement-row"} key={4}>
        <span>{if id = e.fContact then "#{__("Contact")}: #{getItemName(id)}"}</span>
        <span></span>
        <span>{if id = e.eContact then "#{__("Contact")}: #{getItemName(id)}"}</span>
      </Row>

    if e.fFlare or e.eFlare
      rows.push <Row className={"engagement-row"} key={5}>
        <span>{if ship = e.fFlare then "#{__("Star Shell")}: #{getShipName(ship.id)}"}</span>
        <span></span>
        <span>{if ship = e.eFlare then "#{__("Star Shell")}: #{getShipName(ship.id)}"}</span>
      </Row>

    <div className={"engagement-table"}>
    {
      if rows.length > 0
        rows
    }
    </div>


PlaneCount = React.createClass
  render: ->
    {init, now} = @props
    if init?
      <span><FontAwesome name='plane' /> {init} <FontAwesome name='long-arrow-right' /> {now}</span>
    else
      <span />

AntiAirCICell = React.createClass
  render: ->
    {aaciKind, aaciShip, aaciItems} = @props.aerial
    return <span /> unless aaciKind?

    tooltip = []
    tooltip.push <div key={-1}>{__ 'Anti-air Kind'}: {aaciKind}</div>
    for id, i in aaciItems
      tooltip.push <div key={i}>{getItemName(id)}</div>

    <OverlayTrigger placement='top' overlay={
      <Tooltip id="aerial-table-anti-air">
        <div className="anti-air-tooltip">
          {tooltip}
        </div>
      </Tooltip>
    }>
      <span>{__("Anti-air Cut-in")}: {getShipName(aaciShip?.id)} ({aaciKind})</span>
    </OverlayTrigger>

AerialTable = React.createClass
  render: ->
    console.log('AerialTable', @props.aerial)
    {aerial} = @props
    return <div /> unless aerial?

    <div className={"aerial-table"}>
      <Row className={"aerial-row"}>
        <span>
          <PlaneCount init={aerial.fPlaneInit1} now={aerial.fPlaneNow1} />
        </span>
        <span>{if id = aerial.fContact then "#{__("Contact")}: #{getItemName(id)}"}</span>
        <span>{AirControlName[aerial.control]}</span>
        <span>{if id = aerial.eContact then "#{__("Contact")}: #{getItemName(id)}"}</span>
        <span>
          <PlaneCount init={aerial.ePlaneInit1} now={aerial.ePlaneNow1} />
        </span>
      </Row>
      <Row className={"aerial-row"}>
        <span>
          <PlaneCount init={aerial.fPlaneInit2} now={aerial.fPlaneNow2} />
        </span>
        <span></span>
        <span><AntiAirCICell aerial={aerial} /></span>
        <span></span>
        <span>
          <PlaneCount init={aerial.ePlaneInit2} now={aerial.ePlaneNow2} />
        </span>
      </Row>
    </div>


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
    pos = ship.pos
    <span>
      <span>{name}</span>
      <span className="position-indicator">{"(#{pos})"}</span>
    </span>

DamageInfo = React.createClass
  render: ->
    <span>
    {
      elements = []
      elements.push <span key={-1}>{getAttackTypeName(@props.type)}</span>
      elements.push <span key={-2}>{" ("}</span>
      for damage, i in @props.damage
        if @props.hit[i] == HitType.Miss
          damage = "miss"
        cls = ''
        if @props.hit[i] == HitType.Critical
          cls = 'critical'
        elements.push <span key={10 * i + 1} className={cls}>{damage}</span>
        elements.push <span key={10 * i + 2}>{", "}</span>
      elements.pop()  # Remove last comma
      elements.push <span key={-3}>{")"}</span>
      elements
    }
    </span>

AttackRow = React.createClass
  render: ->
    {type, fromShip, toShip, fromHP, toHP, damage, hit, useItem} = @props.attack
    {maxHP} = toShip
    totalDamage = damage.reduce ((p, x) -> p + x)
    # Is enemy attack?
    if toShip.owner is ShipOwner.Ours
      <Row className={"attack-row"}>
        <span><HPBar max={maxHP} from={fromHP} to={toHP} damage={totalDamage} item={useItem} /></span>
        <span><ShipInfo ship={toShip} /></span>
        <span><FontAwesome name='long-arrow-left' /></span>
        <span><DamageInfo type={type} damage={damage} hit={hit} /></span>
        <span></span>
        <span><ShipInfo ship={fromShip} /></span>
        <span></span>
      </Row>
    else
      <Row className={"attack-row"}>
        <span></span>
        <span><ShipInfo ship={fromShip} /></span>
        <span></span>
        <span><DamageInfo type={type} damage={damage} hit={hit} /></span>
        <span><FontAwesome name='long-arrow-right' /></span>
        <span><ShipInfo ship={toShip} /></span>
        <span><HPBar max={maxHP} from={fromHP} to={toHP} damage={totalDamage} item={useItem} /></span>
      </Row>

AttackTable = React.createClass
  render: ->
    {attacks} = @props
    return <div /> unless attacks?.length > 0
    <div className={"attack-table"}>
    {
      for attack, i in attacks
        <AttackRow key={i} attack={attack} />
    }
    </div>


StageTable = React.createClass
  render: ->
    {stage, simulator} = @props
    return <div /> unless stage?
    tables = []

    switch stage.type
      when StageType.Engagement
        title = null

      when StageType.Aerial
        title = __('Aerial Combat')

      when StageType.Torpedo
        if stage.subtype == StageType.Opening
          title = __('Opening Torpedo Salvo')
        else
          title = __('Torpedo Salvo')

      when StageType.Shelling
        switch stage.subtype
          when StageType.Main
            title = "#{__('Shelling')} - #{__('Main Fleet')}"
          when StageType.Escort
            title = "#{__('Shelling')} - #{__('Escort Fleet')}"
          when StageType.Night
            title = __('Night Combat')
          when StageType.Opening
            title = __('Opening Anti-Sub')
          else
            title = __('Shelling')

      when StageType.Support
        switch stage.subtype
          when StageType.Aerial
            title = "#{__('Expedition Supporting Fire')} - #{__('Aerial Support')}"
          when StageType.Shelling
            title = "#{__('Expedition Supporting Fire')} - #{__('Shelling Support')}"
          when StageType.Torpedo
            title = "#{__('Expedition Supporting Fire')} - #{__('Torpedo Support')}"

      when StageType.LandBase
        id = stage.kouku?.api_base_id
        title = "#{__('Land Base Air Corps')} - No.#{id}"

    if stage.engagement?
      tables.push <EngagementTable key={2} engagement={stage.engagement} />
    if stage.aerial?
      tables.push <AerialTable key={1} aerial={stage.aerial} />
    if stage.attacks?
      tables.push <AttackTable key={0} attacks={stage.attacks} />

    <div className={"stage-table"}>
      <div className={"stage-title"}>{title}</div>
      {tables}
      <hr />
    </div>


DetailArea = React.createClass
  render: ->
    {simulator, stages} = @props
    tables = []
    if stages?
      # tables.push <BattleInfoTable key={-1} packet={packet} />
      for stage, i in stages
        tables.push <StageTable key={i} stage={stage} simulator={simulator} />

    <div id="detail-area">
      <Panel header={__("Battle Detail")}>
      {
        if tables.length > 0
          tables
        else
          __("No battle")
      }
      </Panel>
    </div>

module.exports = DetailArea
