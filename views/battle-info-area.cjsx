{React, ReactBootstrap} = window
{Panel, ProgressBar, OverlayTrigger, Overlay, Tooltip} = ReactBootstrap
{Ship, ShipOwner, Attack, AttackType, HitType, Stage, StageType} = require '../lib/common'


# Formation name map from api_search[0-1] to name
# 1=成功, 2=成功(未帰還機あり), 3=未帰還, 4=失敗, 5=成功(艦載機使用せず), 6=失敗(艦載機使用せず)
DetectionNameMap =
  1: __('Success')
  2: __('Success') + ' (' + __('not return') + ')'
  3: __('Failure') + ' (' + __('not return') + ')'
  4: __('Failure')
  5: __('Success') + ' (' + __('without plane') + ')'
  6: __('Failure') + ' (' + __('without plane') + ')'

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


PlaneCount = React.createClass
  render: ->
    total = @props.count
    now = @props.count - @props.lost
    <span><FontAwesome name='plane' /> {total} <FontAwesome name='long-arrow-right' /> {now}</span>

AntiAirCICell = React.createClass
  render: ->
    {$ships, $slotitems} = window
    {api, sortieFleet, combinedFleet} = @props

    if not api?
      return <span />

    shipId = api.api_idx
    shipName = null
    if 0 <= shipId <= 5
      shipName = $ships[sortieFleet[shipId]]?.api_name
    else if 6 <= api.api_idx <= 11
      shipName = $ships[combinedFleet[shipId]]?.api_name
    if not shipName?
      shipName = [api.api_idx, '?'].join ' '

    tooltip = []
    tooltip.push <div key={-1}>{__ 'Anti-air Kind'}: {api.api_kind}</div>
    for itemId, i in api.api_use_items
      tooltip.push <div key={i}>{$slotitems[itemId]?.api_name}</div>

    <OverlayTrigger placement='top' overlay={
      <Tooltip id="battle-info-anti-air">
        <div className="anti-air-tooltip">
          {tooltip}
        </div>
      </Tooltip>
    }>
      <span>{shipName}</span>
    </OverlayTrigger>

BattleDetailArea = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    return false if @props.battleNonce == nextProps.battleNonce
    return true

  render: ->
    packet = @props.battlePacket
    info = []
    if packet?
      # Formation & Engagement
      info.push <div key={0} style={display: "flex"} className={"battle-info-row"}>
        <span style={flex: 4}>{FormationNameMap[packet.api_formation[0]]}</span>
        <span style={flex: 3}>{EngagementNameMap[packet.api_formation[2]]}</span>
        <span style={flex: 4}>{FormationNameMap[packet.api_formation[1]]}</span>
      </div>
      # Detection
      if packet.api_search?
        info.push <div key={1} style={display: "flex"} className={"battle-info-row"}>
          <span style={flex: 4}>{DetectionNameMap[packet.api_search[0]]}</span>
          <span style={flex: 3}>{__ "Detection"}</span>
          <span style={flex: 4}>{DetectionNameMap[packet.api_search[1]]}</span>
        </div>
      info.push <hr key={9} />

      # Aerial combat detail
      # TODO: Show touch plane
      for kouku, id in [packet.api_kouku, packet.api_kouku2]
        continue unless kouku?
        info.push <div key={10 * id + 10} style={display: "flex"} className={"battle-info-row"}>
          <span style={flex: 4}></span>
          <span style={flex: 3}>{__ "Aerial Combat"}</span>
          <span style={flex: 4}></span>
        </div>
        # Stage 1
        if kouku.api_stage1?
          info.push <div key={10 * id + 11} style={display: "flex"} className={"battle-info-row"}>
            <span style={flex: 4}>
              <PlaneCount count={kouku.api_stage1.api_f_count}
                          lost={kouku.api_stage1.api_f_lostcount} />
            </span>
            <span style={flex: 3}>{"Stage 1"}</span>
            <span style={flex: 4}>
              <PlaneCount count={kouku.api_stage1.api_e_count}
                          lost={kouku.api_stage1.api_e_lostcount} />
            </span>
          </div>
        # Stage 2
        if kouku.api_stage2?
          info.push <div key={10 * id + 12} style={display: "flex"} className={"battle-info-row"}>
            <span style={flex: 4}>
              <PlaneCount count={kouku.api_stage2.api_f_count}
                          lost={kouku.api_stage2.api_f_lostcount} />
            </span>
            <span style={flex: 3}>{"Stage 2"}</span>
            <span style={flex: 4}>
              <PlaneCount count={kouku.api_stage2.api_e_count}
                          lost={kouku.api_stage2.api_e_lostcount} />
            </span>
          </div>
          # Anti air cut-in in stage 2
          if kouku.api_stage2.api_air_fire?
            info.push <div key={10 * id + 13} style={display: "flex"} className={"battle-info-row"}>
              <span style={flex: 4}>
                <AntiAirCICell api={kouku.api_stage2.api_air_fire}
                               sortieFleet={packet.poi_sortie_fleet}
                               combinedFleet={packet.poi_combined_fleet}
                               />
              </span>
              <span style={flex: 3}>{"Anti-air Cutin"}</span>
              <span style={flex: 4}></span>
            </div>
        info.push <hr key={10 * id + 19}/>

    <div className="battle-info-area">
      <Panel header={__ "Battle Information"} collapsible>
        {
          if info.length > 0
            info
          else
            __ "No battle"
        }
      </Panel>
    </div>

module.exports = BattleDetailArea
