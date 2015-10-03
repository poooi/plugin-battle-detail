Promise = require 'bluebird'
async = Promise.coroutine
request = Promise.promisifyAll require('request')
{relative, join} = require 'path-extra'
path = require 'path-extra'
fs = require 'fs-extra'
CSON = require 'cson'
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

spotInfo = [
  __(''),
  __('Start'),
  __('Unknown'),
  __('Obtain Resources'),
  __('Lose Resources'),
  __('Battle'),
  __('Boss Battle'),
  __('Battle Avoid'),
  __('Air Strike'),
  __('Escort Success'),
  __('Enemy Detected'),
  __('Manual Selection'),
  __('Aerial Recon')
]

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
  atk: [0, 0, 0, 0, 0, 0]

initInfo =
  lv: [-1, -1, -1, -1, -1, -1]
  name: [0, 0, 0, 0, 0, 0]

initPlaneCount =
  seiku: -1
  sortie: [0, 0]
  enemy: [0, 0]

initId = [-1, -1, -1, -1, -1, -1]
initData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
initMvp = [0, 0, 0]

getCellInfo = (eventId, eventKind, bossCell, CellNo) ->
  if bossCell is CellNo
    return 6
  if eventId is 6
    if eventKind is 1
      return 10
    else if eventKind is 2
      return 11
  else if eventId is 7
    if eventKind is 0
      return 12
  return eventId + 1

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

getResult = (sortieHp, enemyHp, combinedHp, leastHp, mvpPos) ->
  sortieDrop = enemyDrop = 0
  sortieCnt = enemyCnt = 0
  sortieDmg = enemyDmg = 0.0
  sortieTot = enemyTot = 0.0
  mvpPos[i] = 0 for i in [0..2]
  for i in [0..5]
    if sortieHp.now[i] + sortieHp.dmg[i] > 0
      sortieCnt += 1
      sortieTot += (sortieHp.now[i] + sortieHp.dmg[i])
      enemyDmg += sortieHp.dmg[i]
      if sortieHp.now[i] <= 0
        enemyDmg += sortieHp.now[i]
        sortieDrop += 1
        sortieHp.now[i] = 0
      if sortieHp.atk[i] > sortieHp.atk[mvpPos[0]]
        mvpPos[0] = i
    if combinedHp.now[i] + combinedHp.dmg[i] > 0
      sortieCnt += 1
      sortieTot += (combinedHp.now[i] + combinedHp.dmg[i])
      enemyDmg += combinedHp.dmg[i]
      if combinedHp.now[i] <= 0
        enemyDmg += combinedHp.now[i]
        sortieDrop += 1
        combinedHp.now[i] = 0
      if combinedHp.atk[i] > combinedHp.atk[mvpPos[1]]
        mvpPos[1] = i
    if enemyHp.now[i] + enemyHp.dmg[i] > 0
      enemyCnt += 1
      if enemyHp.now[i] == 0
        enemyTot += enemyHp.max[i]
        sortieDmg += enemyHp.max[i]
        enemyDrop += 1
      else
        enemyTot += (enemyHp.now[i] + enemyHp.dmg[i])
        sortieDmg += enemyHp.dmg[i]
        if enemyHp.now[i] <= 0
          sortieDmg += (enemyHp.now[i] - leastHp)
          enemyDrop += 1
          enemyHp.now[i] = 0
        if enemyHp.atk[i] > enemyHp.atk[mvpPos[2]]
          mvpPos[2] = i
  sortieRate = sortieDmg / enemyTot
  enemyRate = enemyDmg / sortieTot
  sortieRate = Math.floor(sortieRate * 100)
  enemyRate = Math.floor(enemyRate * 100)
  equalOrMore = sortieRate > 0.9 * enemyRate
  resultB = sortieRate > 0 && sortieRate > 2.5 * enemyRate
  if sortieDrop == 0
    if enemyDrop == enemyCnt
      return 'S'
    else if enemyDrop >= dropCount[enemyCnt]
      return 'A'
    else if enemyHp.now[0] <= 0 || resultB
      return 'B'
  else
    if enemyDrop == enemyCnt
      return 'S'
    else if (enemyHp.now[0] <= 0 && sortieDrop < enemyDrop) || resultB
      return 'B'
    else if enemyHp.now[0] <= 0
      return 'C'
  if enemyRate > 0
    if equalOrMore
      return 'C'
  if sortieDrop > 0 && (sortieCnt == sortieDrop + 1)
    return 'E'
  return 'D'

checkRepair = (shipId) ->
  {_ships} = window
  slot = Object.clone _ships[shipId].api_slot
  slot.push _ships[shipId].api_slot_ex
  # According to wiki, if both damage control and goddess are equipped,
  # they will be consumed from top to bottom.
  for id in slot
    # For normal slots, -1 means empty or not usable.
    # For the ex slot, 0 means not available, -1 means empty.
    if id > 0
      x = _slotitems[id].api_slotitem_id
      # 42 == Repair Team, 43 == Repair Goddess
      if x >= 42 && x <= 43
        return x
  return 0

koukuAttack = (sortieHp, enemyHp, kouku, sortieInfo) ->
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
      if sortieHp.now[i - 1] <= 0
        repairNum = checkRepair sortieInfo[i - 1]
        if repairNum == 42
          sortieHp.now[i - 1] = Math.floor(sortieHp.max[i - 1] / 5)
          sortieHp.dmg[i - 1] = 0
        else if repairNum == 43
          sortieHp.now[i - 1] = sortieHp.max[i - 1]
          sortieHp.dmg[i - 1] = 0

supportAttack = (enemyHp, support) ->
  for damage, i in support
    damage = Math.floor(damage)
    continue if damage <= 0
    continue if i > 6
    enemyHp.dmg[i - 1] += damage
    enemyHp.now[i - 1] -= damage

raigekiAttack = (sortieHp, enemyHp, raigeki, sortieInfo) ->
  if raigeki.api_edam?
    for damage, i in raigeki.api_edam
      damage = Math.floor(damage)
      continue if damage <= 0
      enemyHp.dmg[i - 1] += damage
      enemyHp.now[i - 1] -= damage
    for damage, i in raigeki.api_fydam
      damage = Math.floor(damage)
      continue if damage <= 0
      sortieHp.atk[i - 1] += damage
  if raigeki.api_fdam?
    for damage, i in raigeki.api_eydam
      damage = Math.floor(damage)
      continue if damage <= 0
      enemyHp.atk[i - 1] += damage
    for damage, i in raigeki.api_fdam
      damage = Math.floor(damage)
      continue if damage <= 0
      sortieHp.dmg[i - 1] += damage
      sortieHp.now[i - 1] -= damage
      if sortieHp.now[i - 1] <= 0
        repairNum = checkRepair sortieInfo[i - 1]
        if repairNum == 42
          sortieHp.now[i - 1] = Math.floor(sortieHp.max[i - 1] / 5)
          sortieHp.dmg[i - 1] = 0
        else if repairNum == 43
          sortieHp.now[i - 1] = sortieHp.max[i - 1]
          sortieHp.dmg[i - 1] = 0

hougekiAttack = (sortieHp, enemyHp, hougeki, sortieInfo) ->
  for damageFrom, i in hougeki.api_at_list
    continue if damageFrom == -1
    for damage, j in hougeki.api_damage[i]
      damage = Math.floor(damage)
      damageTo = hougeki.api_df_list[i][j]
      continue if damage <= 0
      if damageTo < 7
        enemyHp.atk[damageFrom - 1 - 6] += damage
        sortieHp.dmg[damageTo - 1] += damage
        sortieHp.now[damageTo - 1] -= damage
        if sortieHp.now[damageTo - 1] <= 0
          repairNum = checkRepair sortieInfo[damageTo - 1]
          if repairNum == 42
            sortieHp.now[damageTo - 1] = Math.floor(sortieHp.max[damageTo - 1] / 5)
            sortieHp.dmg[damageTo - 1] = 0
          else if repairNum == 43
            sortieHp.now[damageTo - 1] = sortieHp.max[damageTo - 1]
            sortieHp.dmg[damageTo - 1] = 0
      else
        sortieHp.atk[damageFrom - 1] += damage
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

simulateKouku = (api_kouku, planeCount) ->
  if api_kouku.api_stage2?
    planeCount.sortie[0] -= api_kouku.api_stage2.api_f_lostcount
    planeCount.enemy[0] -= api_kouku.api_stage2.api_e_lostcount


simulateBattle = (sortieHp, enemyHp, combinedHp, isCombined, isWater, body, leastHp, planeCount, sortieInfo, combinedInfo, mvpPos) ->
  # First air battle

  if body.api_kouku?
    if body.api_kouku.api_stage1?
      tmp = body.api_kouku.api_stage1
      planeCount.seiku = tmp.api_disp_seiku
      planeCount.sortie[0] = tmp.api_f_count - tmp.api_f_lostcount
      planeCount.sortie[1] = tmp.api_f_count
      planeCount.enemy[0] = tmp.api_e_count - tmp.api_e_lostcount
      planeCount.enemy[1] = tmp.api_e_count
    simulateKouku body.api_kouku, planeCount

    if body.api_kouku.api_stage3?
      koukuAttack sortieHp, enemyHp, body.api_kouku.api_stage3, sortieInfo
    if body.api_kouku.api_stage3_combined?
      koukuAttack combinedHp, enemyHp, body.api_kouku.api_stage3_combined, combinedInfo
  # Second air battle

  if body.api_kouku2?
    simulateKouku body.api_kouku2, planeCount

    if body.api_kouku2.api_stage3?
      koukuAttack sortieHp, enemyHp, body.api_kouku2.api_stage3, sortieInfo
    if body.api_kouku2.api_stage3_combined?
      koukuAttack combinedHp, enemyHp, body.api_kouku2.api_stage3_combined, combinedInfo
  # Support battle

  if body.api_support_info?
    if body.api_support_info.api_support_airatack?
      supportAttack enemyHp, body.api_support_info.api_support_airatack.api_stage3.api_edam
    else if body.api_support_info.api_support_hourai?
      supportAttack enemyHp, body.api_support_info.api_support_hourai.api_damage
    else
      supportAttack enemyHp, body.api_support_info.api_damage
  # Opening battle

  if body.api_opening_atack?
    if isCombined
      raigekiAttack combinedHp, enemyHp, body.api_opening_atack, combinedInfo
    else
      raigekiAttack sortieHp, enemyHp, body.api_opening_atack, sortieInfo
  # Night battle

  if body.api_hougeki?
    if isCombined
      hougekiAttack combinedHp, enemyHp, body.api_hougeki, combinedInfo
    else
      hougekiAttack sortieHp, enemyHp, body.api_hougeki, sortieInfo
  # First hougeki battle

  if body.api_hougeki1?
    if isCombined && !isWater
      hougekiAttack combinedHp, enemyHp, body.api_hougeki1, combinedInfo
    else
      hougekiAttack sortieHp, enemyHp, body.api_hougeki1, sortieInfo
  # Second hougeki battle

  if body.api_hougeki2?
    hougekiAttack sortieHp, enemyHp, body.api_hougeki2, sortieInfo
  # Combined hougeki battle

  if body.api_hougeki3?
    if isCombined && isWater
      hougekiAttack combinedHp, enemyHp, body.api_hougeki3, combinedInfo
    else
      hougekiAttack sortieHp, enemyHp, body.api_hougeki3, sortieInfo
  # Raigeki battle

  if body.api_raigeki?
    if isCombined
      raigekiAttack combinedHp, enemyHp, body.api_raigeki, combinedInfo
    else
      raigekiAttack sortieHp, enemyHp, body.api_raigeki, sortieInfo
  getResult sortieHp, enemyHp, combinedHp, leastHp, mvpPos

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
      # Load map data
      mapspot = null
      try
        mapspot = CSON.parseCSONFile path.join(__dirname, 'assets', 'data', 'mapspot.cson')
      catch
        console.log 'Failed to load map data!'

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
      compactMode: false
      mvpPos: Object.clone initMvp
      # Compass
      mapArea: NaN
      mapCell: NaN
      nowSpot: NaN
      nextSpot: NaN
      nextSpotKind: NaN
      MAPSPOT: mapspot
    handleResponse: (e) ->
      {method, path, body, postBody} = e.detail
      {sortieHp, enemyHp, combinedHp, sortieInfo, enemyInfo, combinedInfo, getShip, planeCount, enemyFormation, enemyIntercept, enemyName, result, enableProphetDamaged, prophetCondShow, combinedFlag, goBack, mvpPos, mapArea, mapCell, nowSpot, nextSpot, nextSpotKind} = @state
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
          sortieHp.dmg[i] = enemyHp.dmg[i] = combinedHp.dmg[i] = sortieHp.atk[i] = enemyHp.atk[i] = combinedHp.atk[i] = 0 for i in [0..5]
          enemyInfo.lv = Object.clone initId
          enemyFormation = enemyIntercept = 0
          enemyName = __ 'Enemy Vessel'
          result = null
          getShip = null
          planeCount = Object.clone initPlaneCount
          # Compass
          mapArea = body.api_maparea_id
          mapCell = body.api_mapinfo_no
          nowSpot = 0
          nextSpot = body.api_no
          nextSpotKind = getCellInfo body.api_event_id, body.api_event_kind, body.api_bosscell_no, body.api_no

        # Enter next point in battle
        when '/kcsapi/api_req_map/next'
          flag = true
          sortieHp.dmg[i] = enemyHp.dmg[i] = combinedHp.dmg[i] = sortieHp.atk[i] = enemyHp.atk[i] = combinedHp.atk[i] = 0 for i in [0..5]
          enemyInfo.lv = Object.clone initId
          enemyFormation = enemyIntercept = 0
          enemyName = __ 'Enemy Vessel'
          result = null
          getShip = null
          planeCount = Object.clone initPlaneCount
          # Comapss
          nowSpot = nextSpot
          nextSpot = body.api_no
          nextSpotKind = getCellInfo body.api_event_id, body.api_event_kind, body.api_bosscell_no, body.api_no

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

          result = simulateBattle sortieHp, enemyHp, combinedHp, false, false, body, 0, planeCount, sortieInfo, combinedInfo, mvpPos

          for i in [0..5]
            sortieHp.dmg[i] -= daySortieDmg[i]
            enemyHp.dmg[i] -= dayEnemyDmg[i]
            combinedHp.dmg[i] -= dayCombinedDmg[i]

        # Practice battle
        when '/kcsapi/api_req_practice/battle', '/kcsapi/api_req_practice/midnight_battle'
          flag = true
          # If practice
          if path == '/kcsapi/api_req_practice/battle'
            sortieHp.dmg[i] = enemyHp.dmg[i] = combinedHp.dmg[i] = sortieHp.atk[i] = enemyHp.atk[i] = combinedHp.atk[i] = 0 for i in [0..5]
            enemyName = __ 'PvP'
            combinedFlag = 0
            sortieInfo = Object.clone window._decks[postBody.api_deck_id - 1].api_ship
            getShipInfo sortieHp, sortieInfo
            getEnemyInfo enemyHp, enemyInfo, body, true
          daySortieDmg = Object.clone sortieHp.dmg
          dayEnemyDmg = Object.clone enemyHp.dmg
          dayCombinedDmg = Object.clone combinedHp.dmg
          result = simulateBattle sortieHp, enemyHp, combinedHp, false, false, body, 1, planeCount, sortieInfo, combinedInfo, mvpPos
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
          result = simulateBattle sortieHp, enemyHp, combinedHp, true, isWater, body, 1, planeCount, sortieInfo, combinedInfo, mvpPos
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
                icon: join(ROOT, 'views', 'components', 'main', 'assets', 'img', 'state', '4.png')
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
          sortieHp.dmg[i] = enemyHp.dmg[i] = combinedHp.dmg[i] = sortieHp.atk[i] = enemyHp.atk[i] = combinedHp.atk[i] = 0 for i in [0..5]
          enemyInfo.lv = Object.clone initId
          enemyFormation = enemyIntercept = 0
          enemyName = __ 'Enemy Vessel'
          result = null
          getShip = null
          planeCount = Object.clone initPlaneCount
          # Compass
          mapArea = NaN
          mapCell = NaN
          nowSpot = NaN
          nextSpot = NaN
          nextSpotKind = NaN

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
          mvpPos: mvpPos
          # Compass
          mapArea: mapArea
          mapCell: mapCell
          nowSpot: nowSpot
          nextSpot: nextSpot
          nextSpotKind: nextSpotKind

    handleDisplayModeSwitch: ->
      @setState
        compactMode: !@state.compactMode

    componentDidMount: ->
      window.addEventListener 'game.response', @handleResponse

    getCompassAngle: ->
      {MAPSPOT, mapArea, mapCell, nowSpot, nextSpot} = @state
      return null unless mapspot = MAPSPOT?[mapArea]?[mapCell]
      return null unless nowPoint = mapspot[nowSpot]
      return null unless nextPoint = mapspot[nextSpot]
      # Calucate and translate to css rorate angle
      angle = Math.atan2(nextPoint[1] - nowPoint[1], nextPoint[0] - nowPoint[0]) / Math.PI * 180
      angle = angle + 90

    render: ->
      <div onDoubleClick={@handleDisplayModeSwitch}>
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
          lay={if layout == 'horizontal' || window.tabbed == 'single' then 0 else 1}
          goBack={@state.goBack}
          compactMode={@state.compactMode}
          mvpPos = {@state.mvpPos}/>
        <BottomAlert
          admiral={__ "Admiral"}
          getShip={@state.getShip}
          joinFleet={__ "Join fleet"}
          formationNum={@state.enemyFormation}
          formation={formation[@state.enemyFormation]}
          intercept={intercept[@state.enemyIntercept]}
          seiku={@state.seiku}
          result={@state.result}
          compassPoint={__ "Compass Point"}
          compassAngle={@getCompassAngle()}
          nextSpot={__ "Next Spot"}
          nextSpotInfo={if @state.nextSpot then "#{spotInfo[@state.nextSpotKind]} (#{@state.nextSpot})"}
          />
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
