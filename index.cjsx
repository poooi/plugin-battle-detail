Promise = require 'bluebird'
async = Promise.coroutine
request = Promise.promisifyAll require('request')
{relative, join} = require 'path-extra'
path = require 'path-extra'
fs = require 'fs-extra'
{_, $, $$, React, ReactBootstrap, ROOT, resolveTime, layout, toggleModal} = window
{Table, ProgressBar, Grid, Input, Col, Alert, Button, Divider} = ReactBootstrap
{APPDATA_PATH, SERVER_HOSTNAME} = window
i18n = require './node_modules/i18n'
{__} = i18n
BottomAlert = require './parts/bottom-alert'
ProphetPanel = require './parts/prophet-panel'
i18n.configure
  locales: ['en-US', 'ja-JP', 'zh-CN']
  defaultLocale: 'zh-CN'
  directory: path.join(__dirname, 'assets', 'i18n')
  updateFiles: false
  indent: '\t'
  extension: '.json'
i18n.setLocale(window.language)

window.addEventListener 'layout.change', (e) ->
  {layout} = e.detail

formation = [
  __("Unknown Formation"),
  __("Line Ahead"),
  __("Double Line"),
  __("Diamond"),
  __("Echelon"),
  __("Line Abreast"),
  __("Cruising Formation 1"),
  __("Cruising Formation 2"),
  __("Cruising Formation 3"),
  __("Cruising Formation 4")
]

intercept = [
  __("Unknown Engagement"),
  __("Parallel Engagement"),
  __("Head-on Engagement"),
  __("Crossing the T (Advantage)"),
  __("Crossing the T (Disadvantage)")
]

dropCount = [
  0, 1, 1, 2, 2, 3, 4
]

dispSeiku = [
  __("Air Parity"),
  __("AS+"),
  __("AS"),
  __("Air Incapability"),
  __("Air Denial")
]

initHp =
  now: [0, 0, 0, 0, 0, 0]
  max: [0, 0, 0, 0, 0, 0]
  dmg: [0, 0, 0, 0, 0, 0]

initInfo =
  lv: [-1, -1, -1, -1, -1, -1]
  name: [0, 0, 0, 0, 0, 0]

initPlaneCount =
  seiku: -1
  sortie: [0, 0]
  enemy: [0, 0]

initId = [-1, -1, -1, -1, -1, -1]
initData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

getEnemyInfo = (enemyHp, enemyInfo, body, isPractice) ->
  {$ships, _ships} = window
  enemyInfo.lv = Object.clone body.api_ship_ke.slice(1, 7)
  enemyHp.now = Object.clone body.api_maxhps.slice(7, 13)
  enemyHp.max = Object.clone body.api_maxhps.slice(7, 13)
  for shipId, i in enemyInfo.lv
    continue if shipId == -1
    enemyInfo.name[i] = $ships[shipId].api_name
    if $ships[shipId].api_yomi != '-' && !isPractice
      enemyInfo.name[i] = enemyInfo.name[i] + $ships[shipId].api_yomi
  enemyInfo.lv = Object.clone body.api_ship_lv.slice(1, 7)

getResult = (sortieHp, enemyHp, combinedHp, leastHp) ->
  sortieDrop = enemyDrop = 0
  sortieCnt = enemyCnt = 0
  sortieDmg = enemyDmg = 0.0
  sortieTot = enemyTot = 0.0
  for i in [0..5]
    if sortieHp.now[i] + sortieHp.dmg[i] > 0
      sortieCnt += 1
      sortieTot += (sortieHp.now[i] + sortieHp.dmg[i])
      enemyDmg += sortieHp.dmg[i]
      if sortieHp.now[i] <= 0
        enemyDmg += sortieHp.now[i]
        sortieDrop += 1
        sortieHp.now[i] = 0
    if combinedHp.now[i] + combinedHp.dmg[i] > 0
      sortieCnt += 1
      sortieTot += (combinedHp.now[i] + combinedHp.dmg[i])
      enemyDmg += combinedHp.dmg[i]
      if combinedHp.now[i] <= 0
        enemyDmg += combinedHp.now[i]
        sortieDrop += 1
        combinedHp.now[i] = 0
    if enemyHp.now[i] + enemyHp.dmg[i] > 0
      enemyCnt += 1
      enemyTot += (enemyHp.now[i] + enemyHp.dmg[i])
      sortieDmg += enemyHp.dmg[i]
      if enemyHp.now[i] <= 0
        sortieDmg += (enemyHp.now[i] - leastHp)
        enemyDrop += 1
        enemyHp.now[i] = 0
  result = 'D'
  if enemyDrop == enemyCnt
    result = 'S'
  else if enemyDrop >= dropCount[enemyCnt]
    result = 'A'
  else if sortieDmg != 0 && (enemyHp.now[0] <= 0 || (sortieDmg * sortieTot >= 2.5 * enemyDmg * enemyTot))
    result = 'B'
  else if sortieDmg != 0 && (sortieDmg * sortieTot >= 1.0 * enemyDmg * enemyTot)
    result = 'C'
  result

koukuAttack = (sortieHp, enemyHp, kouku) ->
  if kouku.api_edam?
    for damage, i in kouku.api_edam
      damage = Math.floor(damage)
      continue if damage <= 0
      enemyHp.dmg[i - 1] += damage
      enemyHp.now[i - 1] -= damage
  if kouku.api_fdam?
    for damage, i in kouku.api_fdam
      damage = Math.floor(damage)
      continue if damage <= 0
      sortieHp.dmg[i - 1] += damage
      sortieHp.now[i - 1] -= damage

supportAttack = (enemyHp, support) ->
  for damage, i in support
    damage = Math.floor(damage)
    continue if damage <= 0
    continue if i > 6
    enemyHp.dmg[i - 1] += damage
    enemyHp.now[i - 1] -= damage

raigekiAttack = (sortieHp, enemyHp, raigeki) ->
  if raigeki.api_edam?
    for damage, i in raigeki.api_edam
      damage = Math.floor(damage)
      continue if damage <= 0
      enemyHp.dmg[i - 1] += damage
      enemyHp.now[i - 1] -= damage
  if raigeki.api_fdam?
    for damage, i in raigeki.api_fdam
      damage = Math.floor(damage)
      continue if damage <= 0
      sortieHp.dmg[i - 1] += damage
      sortieHp.now[i - 1] -= damage

hougekiAttack = (sortieHp, enemyHp, hougeki) ->
  for damageFrom, i in hougeki.api_at_list
    continue if damageFrom == -1
    for damage, j in hougeki.api_damage[i]
      damage = Math.floor(damage)
      damageTo = hougeki.api_df_list[i][j]
      continue if damage <= 0
      if damageTo < 7
        sortieHp.dmg[damageTo - 1] += damage
        sortieHp.now[damageTo - 1] -= damage
      else
        enemyHp.dmg[damageTo - 7] += damage
        enemyHp.now[damageTo - 7] -= damage

getShipInfo = (sortieHp, sortieInfo) ->
  {_ships} = window
  for shipId, i in sortieInfo
    if shipId == -1
      sortieHp.now[i] = sortieHp.max[i] = 0
    else
      sortieHp.now[i] = _ships[shipId].api_nowhp
      sortieHp.max[i] = _ships[shipId].api_maxhp

analogKouku = (api_kouku, planeCount) ->
  # [seiku, f_left, f_all, e_left, e_all]
  if api_kouku.api_stage2?
    planeCount.sortie[0] -= api_kouku.api_stage2.api_f_lostcount
    planeCount.enemy[0] -= api_kouku.api_stage2.api_e_lostcount

checkRepair = (sortieHp, combinedHp, sortieInfo, combinedInfo) ->
  {_ships} = window
  for i in [0..5]
    continue if sortieInfo[i] == -1
    continue if sortieHp[i] > 0
    slot = Object.clone _ships[sortieInfo[i]].api_slot
    slot.push _ships[sortieInfo[i]].api_slot_ex
    for x in slot
      # Repair Team
      if x == 42
        sortieHp.now[i] = Math.floor(sortieHp.max[i] / 4)
        sortieHp.dmg[i] = 0
        break
      # Repair Goddess
      if x == 43
        sortieHp.now[i] = sortieHp.max[i]
        sortieHp.dmg[i] = 0
        break
  for i in [0..5]
    continue if combinedInfo[i] == -1
    continue if combinedHp[i] > 0
    slot = Object.clone _ships[combinedInfo[i]].api_slot
    slot.push _ships[combinedInfo[i]].api_slot_ex
    for x in slot
      # Repair Team
      if x == 42
        combinedHp.now[i] = Math.floor(combinedHp.max[i] / 4)
        combinedHp.dmg[i] = 0
        break
      # Repair Goddess
      if x == 43
        combinedHp.now[i] = combinedHp.max[i]
        combinedHp.dmg[i] = 0
        break

analogBattle = (sortieHp, enemyHp, combinedHp, isCombined, isWater, body, leastHp, planeCount, sortieInfo, combinedInfo) ->
  # First air battle

  if body.api_kouku?
    if body.api_kouku.api_stage1?
      tmp = body.api_kouku.api_stage1
      planeCount.seiku = tmp.api_disp_seiku
      planeCount.sortie[0] = tmp.api_f_count - tmp.api_f_lostcount
      planeCount.sortie[1] = tmp.api_f_count
      planeCount.enemy[0] = tmp.api_e_count - tmp.api_e_lostcount
      planeCount.enemy[1] = tmp.api_e_count
    analogKouku body.api_kouku, planeCount
    checkRepair sortieHp, combinedHp, sortieInfo, combinedInfo

    if body.api_kouku.api_stage3?
      koukuAttack sortieHp, enemyHp, body.api_kouku.api_stage3
    if body.api_kouku.api_stage3_combined?
      koukuAttack combinedHp, enemyHp, body.api_kouku.api_stage3_combined
      checkRepair sortieHp, combinedHp, sortieInfo, combinedInfo
  # Second air battle

  if body.api_kouku2?
    analogKouku body.api_kouku2, planeCount

    if body.api_kouku2.api_stage3?
      koukuAttack sortieHp, enemyHp, body.api_kouku2.api_stage3
    if body.api_kouku2.api_stage3_combined?
      koukuAttack combinedHp, enemyHp, body.api_kouku2.api_stage3_combined
    checkRepair sortieHp, combinedHp, sortieInfo, combinedInfo
  # Support battle

  if body.api_support_info?
    if body.api_support_info.api_support_airatack?
      supportAttack enemyHp, body.api_support_info.api_support_airatack.api_stage3.api_edam
    else if body.api_support_info.api_support_hourai?
      supportAttack enemyHp, body.api_support_info.api_support_hourai.api_damage
    else
      supportAttack enemyHp, body.api_support_info.api_damage
    checkRepair sortieHp, combinedHp, sortieInfo, combinedInfo
  # Opening battle

  if body.api_opening_atack?
    if isCombined
      raigekiAttack combinedHp, enemyHp, body.api_opening_atack
    else
      raigekiAttack sortieHp, enemyHp, body.api_opening_atack
    checkRepair sortieHp, combinedHp, sortieInfo, combinedInfo
  # Night battle

  if body.api_hougeki?
    if isCombined
      hougekiAttack combinedHp, enemyHp, body.api_hougeki
    else
      hougekiAttack sortieHp, enemyHp, body.api_hougeki
    checkRepair sortieHp, combinedHp, sortieInfo, combinedInfo
  # First hougeki battle

  if body.api_hougeki1?
    if isCombined && !isWater
      hougekiAttack combinedHp, enemyHp, body.api_hougeki1
    else
      hougekiAttack sortieHp, enemyHp, body.api_hougeki1
    checkRepair sortieHp, combinedHp, sortieInfo, combinedInfo
  # Second hougeki battle

  if body.api_hougeki2?
    hougekiAttack sortieHp, enemyHp, body.api_hougeki2
    checkRepair sortieHp, combinedHp, sortieInfo, combinedInfo
  # Combined hougeki battle

  if body.api_hougeki3?
    if isCombined && isWater
      hougekiAttack combinedHp, enemyHp, body.api_hougeki3
    else
      hougekiAttack sortieHp, enemyHp, body.api_hougeki3
    checkRepair sortieHp, combinedHp, sortieInfo, combinedInfo
  # Raigeki battle

  if body.api_raigeki?
    if isCombined
      raigekiAttack combinedHp, enemyHp, body.api_raigeki
    else
      raigekiAttack sortieHp, enemyHp, body.api_raigeki
    checkRepair sortieHp, combinedHp, sortieInfo, combinedInfo

  getResult sortieHp, enemyHp, combinedHp, leastHp

escapeId = -1
towId = -1

module.exports =
  name: 'prophet'
  priority: 1
  displayName: <span><FontAwesome key={0} name='compass' />{' ' + __("Prophet")}</span>
  description: __ "Sortie Prophet"
  version: '3.0.0'
  author: 'Chiba'
  link: 'https://github.com/Chibaheit'
  reactClass: React.createClass
    getInitialState: ->
      sortieHp: Object.clone initHp
      enemyHp: Object.clone initHp
      combinedHp: Object.clone initHp
      sortieInfo: Object.clone initId
      enemyInfo: Object.clone initInfo
      combinedInfo: Object.clone initId
      getShip: null
      planeCount: Object.clone initPlaneCount
      sortiePlane: ''
      enemyPlane: ''
      seiku: null
      enemyFormation: 0
      enemyIntercept: 0
      enemyName: __("Enemy Vessel")
      result: null
      enableProphetDamaged: config.get 'plugin.prophet.notify.damaged', true
      prophetCondShow: config.get 'plugin.prophet.show.cond', true
      combinedFlag: 0
      goBack: Object.clone initData
    handleResponse: (e) ->
      {method, path, body, postBody} = e.detail
      {sortieHp, enemyHp, combinedHp, sortieInfo, enemyInfo, combinedInfo, getShip, planeCount, enemyFormation, enemyIntercept, enemyName, result, enableProphetDamaged, prophetCondShow, combinedFlag, goBack} = @state
      enableProphetDamaged = config.get 'plugin.prophet.notify.damaged', true
      prophetCondShow = config.get 'plugin.prophet.show.cond', true
      flag = false
      switch path
        # First enter map in battle
        when '/kcsapi/api_req_map/start'
          flag = true
          if parseInt(postBody.api_deck_id) != 1
            combinedFlag = 0
          if combinedFlag == 0
            sortieInfo = Object.clone window._decks[postBody.api_deck_id - 1].api_ship
            combinedInfo = Object.clone initId
          else
            sortieInfo = Object.clone window._decks[0].api_ship
            combinedInfo = Object.clone window._decks[1].api_ship
          getShipInfo sortieHp, sortieInfo
          getShipInfo combinedHp, combinedInfo
          sortieHp.dmg[i] = enemyHp.dmg[i] = combinedHp.dmg[i] = 0 for i in [0..5]
          enemyInfo.lv = Object.clone initId
          enemyFormation = enemyIntercept = 0
          enemyName = __ 'Enemy Vessel'
          result = null
          getShip = null
          planeCount = Object.clone initPlaneCount
        # Enter next point in battle
        when '/kcsapi/api_req_map/next'
          flag = true
          sortieHp.dmg[i] = enemyHp.dmg[i] = combinedHp.dmg[i] = 0 for i in [0..5]
          enemyInfo.lv = Object.clone initId
          enemyFormation = enemyIntercept = 0
          enemyName = __ 'Enemy Vessel'
          result = null
          getShip = null
          planeCount = Object.clone initPlaneCount
        # Some ship while go back
        when '/kcsapi/api_req_combined_battle/goback_port'
          flag = true
          if escapeId != -1 && towId != -1
            goBack[escapeId] = goBack[towId] = 1
        # Normal battle
        when '/kcsapi/api_req_sortie/airbattle', '/kcsapi/api_req_battle_midnight/sp_midnight', '/kcsapi/api_req_sortie/battle', '/kcsapi/api_req_battle_midnight/battle'
          flag = true
          # The damage in day battle
          daySortieDmg = Object.clone sortieHp.dmg
          dayEnemyDmg = Object.clone enemyHp.dmg
          dayCombinedDmg = Object.clone combinedHp.dmg
          if path != '/kcsapi/api_req_battle_midnight/battle'
            getEnemyInfo enemyHp, enemyInfo, body, false

          result = analogBattle sortieHp, enemyHp, combinedHp, false, false, body, 0, planeCount, sortieInfo, combinedInfo

          for i in [0..5]
            sortieHp.dmg[i] -= daySortieDmg[i]
            enemyHp.dmg[i] -= dayEnemyDmg[i]
            combinedHp.dmg[i] -= dayCombinedDmg[i]
        # Practice battle
        when '/kcsapi/api_req_practice/battle', '/kcsapi/api_req_practice/midnight_battle'
          flag = true
          sortieHp.dmg[i] = enemyHp.dmg[i] = combinedHp.dmg[i] = 0 for i in [0..5]
          # If practice
          if path == '/kcsapi/api_req_practice/battle'
            enemyName = __ 'PvP'
            combinedFlag = 0
            sortieInfo = Object.clone window._decks[postBody.api_deck_id - 1].api_ship
            getShipInfo sortieHp, sortieInfo
            getEnemyInfo enemyHp, enemyInfo, body, true
          daySortieDmg = Object.clone sortieHp.dmg
          dayEnemyDmg = Object.clone enemyHp.dmg
          dayCombinedDmg = Object.clone combinedHp.dmg
          result = analogBattle sortieHp, enemyHp, combinedHp, false, false, body, 1, planeCount, sortieInfo, combinedInfo
          for i in [0..5]
            sortieHp.dmg[i] -= daySortieDmg[i]
            enemyHp.dmg[i] -= dayEnemyDmg[i]
            combinedHp.dmg[i] -= dayCombinedDmg[i]
        # Combined battle
        when '/kcsapi/api_req_combined_battle/airbattle', '/kcsapi/api_req_combined_battle/sp_midnight', '/kcsapi/api_req_combined_battle/battle', '/kcsapi/api_req_combined_battle/battle_water', '/kcsapi/api_req_combined_battle/midnight_battle'
          flag = true
          escapeId = towId = -1
          isWater = false
          # If water combined
          if path == '/kcsapi/api_req_combined_battle/battle_water'
            isWater = true
          daySortieDmg = Object.clone sortieHp.dmg
          dayEnemyDmg = Object.clone enemyHp.dmg
          dayCombinedDmg = Object.clone combinedHp.dmg
          if path != '/kcsapi/api_req_combined_battle/midnight_battle'
            getEnemyInfo enemyHp, enemyInfo, body, false
          result = analogBattle sortieHp, enemyHp, combinedHp, true, isWater, body, 1, planeCount, sortieInfo, combinedInfo
          for i in [0..5]
            sortieHp.dmg[i] -= daySortieDmg[i]
            enemyHp.dmg[i] -= dayEnemyDmg[i]
            combinedHp.dmg[i] -= dayCombinedDmg[i]
        # Battle Result
        when '/kcsapi/api_req_practice/battle_result', '/kcsapi/api_req_sortie/battleresult', '/kcsapi/api_req_combined_battle/battleresult'
          flag = true
          if path != '/kcsapi/api_req_practice/battle_result'
            if body.api_escape_flag? && body.api_escape_flag > 0
              escapeId = body.api_escape.api_escape_idx[0] - 1
              towId = body.api_escape.api_tow_idx[0] - 1
            tmpShip = ""
            for i in [0..5]
              if sortieHp.now[i] < (0.2500001 * sortieHp.max[i]) && goBack[i] == 0
                tmpShip = tmpShip + _ships[sortieInfo[i]].api_name + " "
              if combinedHp.now[i] < (0.2500001 * combinedHp.max[i]) && goBack[6 + i] == 0
                tmpShip = tmpShip + _ships[combinedInfo[i]].api_name + " "
            if tmpShip != ""
              notify "#{tmpShip}" + __('Heavily damaged'),
                type: 'damaged'
                icon: join(ROOT, 'views', 'components', 'ship', 'assets', 'img', 'state', '4.png')
            if body.api_get_ship?
              getShip = body.api_get_ship
          result = body.api_win_rank
        # Return to port
        when '/kcsapi/api_port/port'
          flag = true
          goBack = Object.clone initData
          combinedFlag = body.api_combined_flag
          combinedFlag ?= 0
          if combinedFlag == 0
            sortieInfo = Object.clone window._decks[0].api_ship
            combinedInfo = Object.clone initId
          else
            sortieInfo = Object.clone window._decks[0].api_ship
            combinedInfo = Object.clone window._decks[1].api_ship
          getShipInfo sortieHp, sortieInfo
          getShipInfo combinedHp, combinedInfo
          sortieHp.dmg[i] = enemyHp.dmg[i] = combinedHp.dmg[i] = 0 for i in [0..5]
          enemyInfo.lv = Object.clone initId
          enemyFormation = enemyIntercept = 0
          enemyName = __ 'Enemy Vessel'
          result = null
          getShip = null
          planeCount = Object.clone initPlaneCount

      if body.api_formation?
        enemyFormation = body.api_formation[1]
        enemyIntercept = body.api_formation[2]

      sortiePlane = enemyPlane = ""
      seiku = __ "Unknown FC"

      if planeCount.seiku != -1
        if planeCount.sortie[1] != 0
          sortiePlane = " #{planeCount.sortie[0]}/#{planeCount.sortie[1]}"
        if planeCount.enemy[1] != 0
          enemyPlane = " #{planeCount.enemy[0]}/#{planeCount.enemy[1]}"
        seiku = dispSeiku[planeCount.seiku]

      if flag
        @setState
          sortieHp: sortieHp
          enemyHp: enemyHp
          combinedHp: combinedHp
          sortieInfo: sortieInfo
          enemyInfo: enemyInfo
          combinedInfo: combinedInfo
          getShip: getShip
          planeCount: planeCount
          sortiePlane: sortiePlane
          enemyPlane: enemyPlane
          seiku: seiku
          enemyFormation: enemyFormation
          enemyIntercept: enemyIntercept
          enemyName: enemyName
          result: result
          enableProphetDamaged: enableProphetDamaged
          prophetCondShow: prophetCondShow
          combinedFlag: combinedFlag
          goBack: goBack

    componentDidMount: ->
      window.addEventListener 'game.response', @handleResponse

    render: ->
      <div>
        <link rel="stylesheet" href={join(relative(ROOT, __dirname), 'assets', 'prophet.css')} />
        <ProphetPanel
          sortieHp={@state.sortieHp}
          enemyHp={@state.enemyHp}
          combinedHp={@state.combinedHp}
          sortieInfo={@state.sortieInfo}
          enemyInfo={@state.enemyInfo}
          combinedInfo={@state.combinedInfo}
          HP={__ "HP"}
          sortieFleet={__ "Sortie Fleet"}
          enemyName={@state.enemyName}
          sortiePlane={@state.sortiePlane}
          enemyPlane={@state.enemyPlane}
          cols={if @state.combinedFlag == 0 then 0 else 1}
          lay={if layout == 'horizonal' || window.doubleTabbed then 0 else 1}
          goBack={@state.goBack}/>
        <BottomAlert
          admiral={__ "Admiral"}
          getShip={@state.getShip}
          joinFleet={__ "Join fleet"}
          formationNum={@state.enemyFormation}
          formation={formation[@state.enemyFormation]}
          intercept={intercept[@state.enemyIntercept]}
          seiku={@state.seiku}
          result={@state.result} />
      </div>
  settingsClass: React.createClass
    getInitialState: ->
      enableProphetDamaged: config.get 'plugin.prophet.notify.damaged', true
      prophetCondShow: config.get 'plugin.prophet.show.cond', true
    handleSetProphetDamaged: ->
      {enableProphetDamaged} = @state
      config.set 'plugin.prophet.notify.damaged', !enableProphetDamaged
      @setState
        enableProphetDamaged: !enableProphetDamaged
    handleSetProphetCond: ->
      {prophetCondShow} = @state
      config.set 'plugin.prophet.show.cond', !prophetCondShow
      @setState
        prophetCondShow: !prophetCondShow
    render: ->
      <div className="form-group">
        <Grid>
          <Col xs={6}>
            <Button bsStyle={if @state.enableProphetDamaged then 'success' else 'danger'} onClick={@handleSetProphetDamaged} style={width: '100%'}>
              {if @state.enableProphetDamaged then '√ ' else ''}开启大破通知
            </Button>
          </Col>
          <Col xs={6}>
            <Button bsStyle={if @state.prophetCondShow then 'success' else 'danger'} onClick={@handleSetProphetCond} style={width: '100%'}>
              {if @state.prophetCondShow then '√ ' else ''}开启Cond显示
            </Button>
          </Col>
        </Grid>
      </div>
