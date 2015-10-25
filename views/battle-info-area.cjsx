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
    <span style={flex: 13} key={@props.key}>「<FontAwesome name='plane' /> {@props.count - @props.lostcount}/{@props.count}」</span>

BattleDetailArea = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    return false if @props.battleNonce == nextProps.battleNonce
    return true

  render: ->
    packet = @props.battlePacket
    info = []
    if packet?
      info.push <div style={display: "flex"} className={"battle-info"}>
        <span style={flex: 13} key={0}>{DetectionNameMap[packet.api_search[0]]} {FormationNameMap[packet.api_formation[0]]}</span>
        <span style={flex: 6} key={1}>{EngagementNameMap[packet.api_formation[2]]}</span>
        <span style={flex: 13} key={2}>{DetectionNameMap[packet.api_search[0]]} {FormationNameMap[packet.api_formation[0]]}</span>
      </div>
      for kouku, idx in [packet.api_kouku, packet.api_kouku2]
        if api_air_fire = kouku?.api_stage2?.api_air_fire
          info.push <div style={display: "flex"} className={"battle-info"}>
            <span style={flex: 13} key={3 + idx * 6 + 1}></span>
            <span style={flex: 6} key={3 + idx * 6 + 2}>{__ "Aerial Combat"} {idx + 1}</span>
            <span style={flex: 13} key={3 + idx * 6 + 3}></span>
          </div>
          #TODO: api_stage1.api_touch_plane	：触接装備ID　[0]=味方, [1]=敵
          info.push <div style={display: "flex"} className={"battle-info"}>
            <PlaneCount key={3 + idx * 6 + 4} count={kouku.api_stage1.api_f_count} lostcount={kouku.api_stage1.api_f_lostcount} />
            <span style={flex: 6} key={3 + idx * 6 + 5}></span>
            <PlaneCount key={3 + idx * 6 + 6} count={kouku.api_stage1.api_e_count} lostcount={kouku.api_stage1.api_e_lostcount} />
          </div>
          shipInfo = []
          shipInfo.push <div>
            <span key={100 + idx * 5}>{__ 'Kind'}: {api_air_fire.api_kind}</span>
          </div>
          for itemId, i in api_air_fire.api_use_items
            shipInfo.push <div>
              <span key={100 + idx * 5 + 1 + i}>{window.$slotitems[api_air_fire.api_use_items[i]].api_name}</span>
            </div>
          info.push <div style={display: "flex"} className={"battle-info"}>
            <PlaneCount key={3 + idx * 6 + 4} count={kouku.api_stage2.api_f_count} lostcount={kouku.api_stage2.api_f_lostcount} />
            <span style={flex: 6} key={3 + idx * 6 + 5}>
              <OverlayTrigger placement='top' overlay={
                <Tooltip id="battle-info-#{idx}">
                  <div>
                    {shipInfo}
                  </div>
                </Tooltip>
              }>
                <div>
                  <span key={100 + idx * 5+ 4}>{__ 'AA CI'}: {window.$ships[packet.poi_sortie_fleet[api_air_fire.api_idx]].api_name}</span>
                </div>
              </OverlayTrigger>
            </span>
            <PlaneCount key={3 + idx * 6 + 6} count={kouku.api_stage2.api_e_count} lostcount={kouku.api_stage2.api_e_lostcount} />
          </div>

    <div className="battle-info-area">
      <Panel header={__ "Battle Information"} collapsible>
        {info}
      </Panel>
    </div>

module.exports = BattleDetailArea
