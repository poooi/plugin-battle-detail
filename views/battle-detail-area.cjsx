"use strict"

{React, ReactBootstrap} = window
{Panel, ProgressBar, OverlayTrigger, Overlay, Tooltip} = ReactBootstrap

PacketManager = require('../lib/packet-manager')
Simulator2 = require('../lib/simulator2')
{Stage, StageType, Attack, AttackType, HitType, Ship, ShipOwner} = require('../lib/models')
{Battle} = require('../lib/models')


# Formation name map from api_search[0-1] to name
# 1=成功, 2=成功(未帰還機あり), 3=未帰還, 4=失敗, 5=成功(艦載機使用せず), 6=失敗(艦載機使用せず)
DetectionNameMap =
  1: __('Detection Success')
  2: __('Detection Success') + ' (' + __('not return') + ')'
  3: __('Detection Failure') + ' (' + __('not return') + ')'
  4: __('Detection Failure')
  5: __('Detection Success') + ' (' + __('without plane') + ')'
  6: __('Detection Failure') + ' (' + __('without plane') + ')'

# Formation name map from api_formation[0-1] to name
# 1=単縦陣, 2=複縦陣, 3=輪形陣, 4=梯形陣, 5=単横陣, 11-14=第n警戒航行序列
FormationNameMap =
  1: __ 'Line Ahead'
  2: __ 'Double Line'
  3: __ 'Diamond'
  4: __ 'Echelon'
  5: __ 'Line Abreast'
  11: __ 'Cruising Formation 1 (anti-sub)'
  12: __ 'Cruising Formation 2 (forward)'
  13: __ 'Cruising Formation 3 (ring)'
  14: __ 'Cruising Formation 4 (battle)'

# Engagement name map from api_formation[2] to name
# 1=同航戦, 2=反航戦, 3=T字戦有利, 4=T字戦不利
EngagementNameMap =
  1: __ 'Parallel Engagement'
  2: __ 'Head-on Engagement'
  3: __ 'Crossing the T (Advantage)'
  4: __ 'Crossing the T (Disadvantage)'

# Air Control name map from api_kouku.api_stage1.api_disp_seiku to name
# 0=制空均衡, 1=制空権確保, 2=航空優勢, 3=航空劣勢, 4=制空権喪失
AirControlNameMap =
  0: __ 'Air Parity'
  1: __ 'Air Supremacy'
  2: __ 'Air Superiority'
  3: __ 'Air Incapability'
  4: __ 'Air Denial'

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


getHpStyle = (percent) ->
  if percent <= 25
    'danger'
  else if percent <= 50
    'warning'
  else if percent <= 75
    'info'
  else
    'success'


simulate = (battle) ->
  try
    return {} unless battle instanceof Object

    # Keep compatibility for version 1.0
    if not battle.version?
      battle = PacketManager.convertV1toV2(battle)

    simulator = new Simulator2(battle.fleet)
    stages = []
    for packet in battle.packet
      stages = stages.concat(simulator.simulate(packet))
    return {simulator, stages}

  catch error
    console.error error
    return {}


EngagementTable = React.createClass
  render: ->
    {simulator, stage} = @props
    {api_search, api_formation, api_touch_plane, api_flare_pos} = stage.api
    rows = []

    if api_formation?
      rows.push <div className={"engagement-row"} key={1}>
        <span>{FormationNameMap[api_formation[0]]}</span>
        <span>{EngagementNameMap[api_formation[2]]}</span>
        <span>{FormationNameMap[api_formation[1]]}</span>
      </div>

    if api_search?
      rows.push <div className={"engagement-row"} key={2}>
        <span>{DetectionNameMap[api_search[0]]}</span>
        <span></span>
        <span>{DetectionNameMap[api_search[1]]}</span>
      </div>

    if api_touch_plane? or api_flare_pos?
      contact = api_touch_plane
      fleet = if simulator.fleetType == 0 then simulator.mainFleet else simulator.escortFleet
      enemy = simulator.enemyFleet
      star = [fleet[api_flare_pos[0]] || -1, enemy[api_flare_pos[1]] || -1]
      <div className={"engagement-row"}>
        <span>{if name = $slotitems[contact[0]]?.api_name then "#{__ 'Night Contact'}: #{__r name}"}</span>
        <span>{if name = $ships[star[0]]?.api_name then "#{__ 'Star Shell'}: #{__r name}"}</span>
        <span>{if name = $ships[star[1]]?.api_name then "#{__ 'Star Shell'}: #{__r name}"}</span>
        <span>{if name = $slotitems[contact[1]]?.api_name then "#{__ 'Night Contact'}: #{__r name}"}</span>
      </div>

    <div className={"engagement-table"}>
    {
      if rows.length > 0
        rows
    }
    </div>


PlaneCount = React.createClass
  render: ->
    total = @props.count
    now = @props.count - @props.lost
    if total?
      <span><FontAwesome name='plane' /> {total} <FontAwesome name='long-arrow-right' /> {now}</span>
    else
      <span />

AntiAirCICell = React.createClass
  render: ->
    {$ships, $slotitems} = window
    {api, mainFleet, escortFleet} = @props

    if not api?
      return <span />

    idx = api.api_idx
    if 0 <= idx <= 5
      shipId = mainFleet[idx]?.id
    else if 6 <= idx <= 11
      shipId = escortFleet[idx - 6]?.id
    else
      shipId = -1
    shipName = __r($ships[shipId]?.api_name)
    if not shipName?
      shipName = "#{idx}?"

    tooltip = []
    tooltip.push <div key={-1}>{__ 'Anti-air Kind'}: {api.api_kind}</div>
    for itemId, i in api.api_use_items
      tooltip.push <div key={i}>{if $slotitems[itemId]? then __r $slotitems[itemId].api_name}</div>

    <OverlayTrigger placement='top' overlay={
      <Tooltip id="aerial-table-anti-air">
        <div className="anti-air-tooltip">
          {tooltip}
        </div>
      </Tooltip>
    }>
      <span>{__ "Anti-air Cut-in"}: {shipName} ({api.api_kind})</span>
    </OverlayTrigger>

AerialTable = React.createClass
  render: ->
    {simulator, kouku} = @props
    return <div /> unless kouku?

    <div className={"aerial-table"}>
    {
      # Stage 1
      if kouku.api_stage1?
        contact = kouku.api_stage1.api_touch_plane || [-1, -1]
        <div className={"aerial-row"}>
          <span>
            <PlaneCount count={kouku.api_stage1.api_f_count}
                        lost={kouku.api_stage1.api_f_lostcount} />
          </span>
          <span>{if name = $slotitems[contact[0]]?.api_name then "#{__ 'Aerial Contact'}: #{__r name}"}</span>
          <span>{AirControlNameMap[kouku.api_stage1.api_disp_seiku]}</span>
          <span>{if name = $slotitems[contact[1]]?.api_name then "#{__ 'Aerial Contact'}: #{__r name}"}</span>
          <span>
            <PlaneCount count={kouku.api_stage1.api_e_count}
                        lost={kouku.api_stage1.api_e_lostcount} />
          </span>
        </div>
    }
    {
      # Stage 2
      if kouku.api_stage2?
        <div className={"aerial-row"}>
          <span>
            <PlaneCount count={kouku.api_stage2.api_f_count}
                        lost={kouku.api_stage2.api_f_lostcount} />
          </span>
          <span></span>
          <span>
            <AntiAirCICell api={kouku.api_stage2.api_air_fire}
                           mainFleet={simulator.mainFleet}
                           escortFleet={simulator.escortFleet}
                           />
          </span>
          <span></span>
          <span>
            <PlaneCount count={kouku.api_stage2.api_e_count}
                        lost={kouku.api_stage2.api_e_lostcount} />
          </span>
        </div>
    }
    </div>


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
      <div className={"attack-row"}>
        <span><HpBar max={maxHP} from={fromHP} to={toHP} damage={totalDamage} item={useItem} /></span>
        <span><ShipInfo ship={toShip} /></span>
        <span><FontAwesome name='long-arrow-left' /></span>
        <span><DamageInfo type={type} damage={damage} hit={hit} /></span>
        <span></span>
        <span><ShipInfo ship={fromShip} /></span>
        <span></span>
      </div>
    else
      <div className={"attack-row"}>
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
    additions = []

    switch stage.type
      when StageType.Engagement
        additions.push <EngagementTable key={1} simulator={simulator} stage={stage} />

      when StageType.Aerial
        title = __('Aerial Combat')
        additions.push <AerialTable simulator={simulator} kouku={stage.kouku} />

      when StageType.Torpedo
        title = __('Torpedo Salvo')

      when StageType.Shelling
        switch stage.subtype
          when StageType.Main
            title = "#{__('Shelling')} - #{__('Main Fleet')}"
          when StageType.Escort
            title = "#{__('Shelling')} - #{__('Escort Fleet')}"
          when StageType.Night
            title = __('Night Combat')
            additions.push <EngagementTable key={1} simulator={simulator} stage={stage} />

      when StageType.Support
        switch stage.subtype
          when StageType.Aerial
            title = "#{__('Expedition Supporting Fire')} - #{__('Aerial Combat')}"
            additions.push <AerialTable simulator={simulator} kouku={stage.kouku} />
          when StageType.Torpedo
            title = "#{__('Expedition Supporting Fire')} - #{__('Torpedo Salvo')}"
          when StageType.Shelling
            title = "#{__('Expedition Supporting Fire')} - #{__('Shelling')}"

      when StageType.LandBase
        id = stage.kouku?.api_base_id
        title = "#{__('Land Base Air Corps')} - No.#{id}"
        additions.push <AerialTable simulator={simulator} kouku={stage.kouku} />

    <div className={"stage-table"}>
      <div className={"stage-title"}>{title}</div>
      {additions}
      <AttackTable attacks={stage.attacks} />
      <hr />
    </div>


BattleDetailArea = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    return false if @props.nonce == nextProps.nonce
    return true

  render: ->
    {simulator, stages} = simulate(@props.battle)
    tables = []
    if stages?
      # tables.push <BattleInfoTable key={-1} packet={packet} />
      for stage, i in stages
        tables.push <StageTable key={i} stage={stage} simulator={simulator} />

    <div className="battle-detail-area">
      <Panel header={__ "Battle Detail"}>
      {
        if tables.length > 0
          tables
        else
          __ "No battle"
      }
      </Panel>
    </div>

module.exports = BattleDetailArea
