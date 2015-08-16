Promise = require 'bluebird'
async = Promise.coroutine
request = Promise.promisifyAll require('request')
{relative, join} = require 'path-extra'
path = require 'path-extra'
fs = require 'fs-extra'
{_, $, $$, React, ReactBootstrap, ROOT, resolveTime, layout, toggleModal} = window
{Table, ProgressBar, Grid, Input, Col, Alert, Button} = ReactBootstrap
{APPDATA_PATH, SERVER_HOSTNAME} = window
i18n = require './node_modules/i18n'
{__} = i18n
BottomAlert = require './parts/bottom-alert'
ProphetPanel = require './parts/prophet-panel'
i18n.configure
  locales: ['en_US', 'ja_JP', 'zh_CN']
  defaultLocale: 'en_US'
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

getEnemyInfo = (enemyHp, enemyInfo, enemyId, enemyLv, enemyMaxHp, leastHp) ->
  {$ships, _ships} = window
  for shipId, i in enemyId
    continue if shipId == -1
    continue if enemyInfo[i - 1] != -1
    enemyInfo[i - 1] = enemyLv[i]
    enemyHp[i - 1] = enemyHp[i - 1 + 6] = enemyMaxHp[i + 6]
    if $ships[shipId].api_yomi == "-"
      enemyInfo[i - 1 + 6] = $ships[shipId].api_name
    else
      if leastHp == 0
        enemyInfo[i - 1 + 6] = $ships[shipId].api_name + $ships[shipId].api_yomi
      else
        enemyInfo[i - 1 + 6] = $ships[shipId].api_name
  [enemyHp, enemyInfo]

getResult = (sortieHp, enemyHp, combinedHp, result, leastHp) ->
  sortieDrop = enemyDrop = 0
  sortieCnt = enemyCnt = 0
  sortieDmg = enemyDmg = 0.0
  sortieTot = enemyTot = 0.0
  for i in [0..5]
    if sortieHp[i] + sortieHp[i + 12] > 0
      sortieCnt += 1
      sortieTot += (sortieHp[i] + sortieHp[i + 12])
      enemyDmg += sortieHp[i + 12]
      if sortieHp[i] <= 0
        enemyDmg += (sortieHp[i] - 0)
        sortieDrop += 1
        sortieHp[i] = 0
    if combinedHp[i] + combinedHp[i + 12] > 0
      sortieCnt += 1
      sortieTot += (combinedHp[i] + combinedHp[i + 12])
      enemyDmg += combinedHp[i + 12]
      if combinedHp[i] <= 0
        enemyDmg += (combinedHp[i] - 0)
        sortieDrop += 1
        combinedHp[i] = 0
    if enemyHp[i] + enemyHp[i + 12] > 0
      enemyCnt += 1
      enemyTot += (enemyHp[i] + enemyHp[i + 12])
      sortieDmg += enemyHp[i + 12]
      if enemyHp[i] <= leastHp
        sortieDmg += (enemyHp[i] - leastHp)
        enemyDrop += 1
        enemyHp[i] = leastHp
    if enemyDrop == enemyCnt
      result = 'S'
    else if enemyDrop >= dropCount[enemyCnt]
      result = 'A'
    else if sortieDmg != 0 && (enemyHp[0] <= leastHp || (sortieDmg * sortieTot >= 2.5 * enemyDmg * enemyTot))
      result = 'B'
    else if sortieDmg != 0 && (sortieDmg * sortieTot >= 1.0 * enemyDmg * enemyTot)
      result = 'C'
    else
      result = 'D'
  [sortieHp, enemyHp, combinedHp, result]

koukuAttack = (sortieHp, enemyHp, kouku) ->
  if kouku.api_edam?
    for damage, i in kouku.api_edam
      damage = Math.floor(damage)
      continue if damage <= 0
      enemyHp[i - 1 + 12] += damage
      enemyHp[i - 1 ] -= damage
  if kouku.api_fdam?
    for damage, i in kouku.api_fdam
      damage = Math.floor(damage)
      continue if damage <= 0
      sortieHp[i - 1 + 12] += damage
      sortieHp[i - 1] -= damage
  [sortieHp, enemyHp]

supportAttack = (enemyHp, support) ->
  for damage, i in support
    damage = Math.floor(damage)
    continue if damage <= 0
    continue if i > 6
    enemyHp[i - 1 + 12] += damage
    enemyHp[i - 1] -= damage
  enemyHp

raigekiAttack = (sortieHp, enemyHp, raigeki) ->
  if raigeki.api_edam?
    for damage, i in raigeki.api_edam
      damage = Math.floor(damage)
      continue if damage <= 0
      enemyHp[i - 1 + 12] += damage
      enemyHp[i - 1] -= damage
  if raigeki.api_fdam?
    for damage, i in raigeki.api_fdam
      damage = Math.floor(damage)
      continue if damage <= 0
      sortieHp[i - 1 + 12] += damage
      sortieHp[i - 1] -= damage
  [sortieHp, enemyHp]

hougekiAttack = (sortieHp, enemyHp, hougeki) ->
  for damageFrom, i in hougeki.api_at_list
    continue if damageFrom == -1
    for damage, j in hougeki.api_damage[i]
      damage = Math.floor(damage)
      damageTo = hougeki.api_df_list[i][j]
      continue if damage <= 0
      if damageTo < 7
        sortieHp[damageTo - 1 + 12] += damage
        sortieHp[damageTo - 1] -= damage
      else
        enemyHp[damageTo - 1 + 6] += damage
        enemyHp[damageTo - 1 - 6] -= damage
  [sortieHp, enemyHp]

initData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
initData1 = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]

getDeckInfo = (sortieHp, sortieInfo, deckId) ->
  _deck = window._decks[deckId]
  {_ships} = window
  for shipId, i in _deck.api_ship
    continue if shipId == -1
    sortieHp[i] = _ships[shipId].api_nowhp
    sortieHp[6 + i] = _ships[shipId].api_maxhp
    sortieHp[12 + i] = 0
    sortieInfo[i] = _ships[shipId].api_lv
    sortieInfo[6 + i] = _ships[shipId].api_name
    sortieInfo[12 + i] = _ships[shipId].api_cond
  [sortieHp, sortieInfo]

analogBattle = (sortieHp, enemyHp, combinedHp, result, isCombined, isWater, body, leastHp) ->
  # First air battle
  if body.api_kouku?
    if body.api_kouku.api_stage3?
      [sortieHp, enemyHp] = koukuAttack sortieHp, enemyHp, body.api_kouku.api_stage3
    if body.api_kouku.api_stage3_combined?
      [combinedHp, enemyHp] = koukuAttack combinedHp, enemyHp, body.api_kouku.api_stage3_combined
  # Second air battle
  if body.api_kouku2?
    if body.api_kouku2.api_stage3?
      [sortieHp, enemyHp] = koukuAttack sortieHp, enemyHp, body.api_kouku2.api_stage3
    if body.api_kouku2.api_stage3_combined?
      [combinedHp, enemyHp] = koukuAttack combinedHp, enemyHp, body.api_kouku2.api_stage3_combined
  # Support battle
  if body.api_support_info?
    if body.api_support_info.api_support_airatack?
      enemyHp = supportAttack enemyHp, body.api_support_info.api_support_airatack.api_stage3.api_edam
    else if body.api_support_info.api_support_hourai?
      enemyHp = supportAttack enemyHp, body.api_support_info.api_support_hourai.api_damage
    else
      enemyHp = supportAttack enemyHp, body.api_support_info.api_damage
  # Opening battle
  if body.api_opening_atack?
    if isCombined?
      [combinedHp, enemyHp] = raigekiAttack combinedHp, enemyHp, body.api_opening_atack
    else
      [sortieHp, enemyHp] = raigekiAttack sortieHp, enemyHp, body.api_opening_atack
  # Night battle
  if body.api_hougeki?
    if isCombined?
      [combinedHp, enemyHp] = hougekiAttack combinedHp, enemyHp, body.api_hougeki
    else
      [sortieHp, enemyHp] = hougekiAttack sortieHp, enemyHp, body.api_hougeki
  # First hougeki battle
  if body.api_hougeki1?
    if isCombined? && isWater == null
      [combinedHp, enemyHp] = hougekiAttack combinedHp, enemyHp, body.api_hougeki1
    else
      [sortieHp, enemyHp] = hougekiAttack sortieHp, enemyHp, body.api_hougeki1
  # Second hougeki battle
  if body.api_hougeki2?
    [sortieHp, enemyHp] = hougekiAttack sortieHp, enemyHp, body.api_hougeki2
  # Combined hougeki battle
  if body.api_hougeki3?
    if isCombined? && isWater?
      [combinedHp, enemyHp] = hougekiAttack combinedHp, enemyHp, body.api_hougeki3
    else
      [sortieHp, enemyHp] = hougekiAttack sortieHp, enemyHp, body.api_hougeki3
  # Raigeki battle
  if body.api_raigeki?
    if isCombined?
      [combinedHp, enemyHp] = raigekiAttack combinedHp, enemyHp, body.api_raigeki
    else
      [sortieHp, enemyHp] = raigekiAttack sortieHp, enemyHp, body.api_raigeki
  [sortieHp, enemyHp, combinedHp, result] = getResult sortieHp, enemyHp, combinedHp, result, leastHp
  [sortieHp, enemyHp, combinedHp, result]

module.exports =
  name: 'prophet'
  priority: 1
  displayName: <span><FontAwesome key={0} name='compass' />{' ' + __("Prophet")}</span>
  description: __ "Sortie Prophet"
  version: '2.0.0'
  author: 'Chiba'
  link: 'https://github.com/Chibaheit'
  reactClass: React.createClass
    getInitialState: ->
      # 0 <= i <= 5, hp[i] = nowhp, hp[6 + i] = maxhp, hp[12 + i] = damagehp
      sortieHp: Object.clone initData
      enemyHp: Object.clone initData
      combinedHp: Object.clone initData
      # 0 <= i <= 5, info[i] = lv, info[6 + i] = name, info[12 + i] = cond
      sortieInfo: Object.clone initData1
      enemyInfo: Object.clone initData1
      combinedInfo: Object.clone initData1
      getShip: null
      enemyFormation: 0
      enemyIntercept: 0
      enemyName: __("Enemy Vessel")
      result: __("Unknown")
      enableProphetDamaged: config.get 'plugin.prophet.notify.damaged', true
      prophetCondShow: config.get 'plugin.prophet.show.cond', true
      combinedFlag: 0
    handleResponse: (e) ->
      {method, path, body, postBody} = e.detail
      {sortieHp, enemyHp, combinedHp, sortieInfo, enemyInfo, combinedInfo, getShip, enemyFormation, enemyIntercept, enemyName, result, enableProphetDamaged, prophetCondShow, combinedFlag} = @state
      enableProphetDamaged = config.get 'plugin.prophet.notify.damaged', true
      prophetCondShow = config.get 'plugin.prophet.show.cond', true
      if path == '/kcsapi/api_req_map/start' || path == '/kcsapi/api_req_map/next'
        enemyInfo[i] = -1 for i in [0..5]
        enemyHp = Object.clone initData
        for i in [12..17]
          sortieHp[i] = combinedHp[i] = 0
        enemyFormation = 0
        enemyIntercept = 0
        enemyName = __ 'Enemy Vessel'
        result = __ 'Unknown'
        getShip = null
      if path == '/kcsapi/api_req_map/start'
        for i in [0..5]
          sortieInfo[i] = -1
          combinedInfo[i] = -1
        if postBody.api_deck_id != 1
          combinedFlag = 0
        if combinedFlag == 0
          [sortieHp, sortieInfo] = getDeckInfo sortieHp, sortieInfo, postBody.api_deck_id - 1
        else
          [sortieHp, sortieInfo] = getDeckInfo sortieHp, sortieInfo, 0
          [combinedHp, combinedInfo] = getDeckInfo combinedHp, combinedInfo, 1
      isResult = path.match /result/
      isBattle = path.match /battle/
      isPractice = path.match /practice/
      isCombined = path.match /combined/
      isWater = path.match /water/
      if isResult? && (isBattle? || isPractice)
        if isPractice == null
          tmpShip = " "
          for i in [0..5]
            if sortieHp[i] < (sortieHp[6 + i] * 0.2500001)
              tmpShip = tmpShip + sortieInfo[6 + i] + " "
            if combinedHp[i] < (combinedHp[6 + i] * 0.2500001)
              tmpShip = tmpShip + combinedInfo[6 + i] + " "
          if tmpShip != " "
            notify "#{tmpShip}" + __ 'Heavily damaged',
              type: 'damaged'
              icon: join(ROOT, 'views', 'components', 'ship', 'assets', 'img', 'state', '4.png')
          if body.api_get_ship?
            getShip = body.api_get_ship
        result = body.api_win_rank
      else if isBattle?
        sortiePre = Object.clone sortieHp
        enemyPre = Object.clone enemyHp
        combinedPre = Object.clone combinedHp
        leastHp = 0
        if isPractice?
          leastHp = 1
        [enemyHp, enemyInfo] = getEnemyInfo enemyHp, enemyInfo, body.api_ship_ke, body.api_ship_lv, body.api_maxhps, leastHp
        if body.api_formation?
          enemyFormation = body.api_formation[1]
          enemyIntercept = body.api_formation[2]
        [sortieHp, enemyHp, combinedHp, result] = analogBattle sortieHp, enemyHp, combinedHp, result, isCombined, isWater, body, leastHp
        for i in [12..17]
          sortieHp[i] = sortieHp[i] - sortiePre[i]
          enemyHp[i] = enemyHp[i] - enemyPre[i]
          combinedHp[i] = combinedHp[i] - combinedPre[i]
      else if path == '/kcsapi/api_port/port'
        combinedFlag = body.api_combined_flag
        for i in [0..5]
          sortieInfo[i] = -1
          enemyInfo[i] = -1
          combinedInfo[i] = -1
        sortieHp = Object.clone initData
        enemyHp = Object.clone initData
        combinedHp = Object.clone initData
        if combinedFlag == 0
          [sortieHp, sortieInfo] = getDeckInfo sortieHp, sortieInfo, 0
        else
          [sortieHp, sortieInfo] = getDeckInfo sortieHp, sortieInfo, 0
          [combinedHp, combinedInfo] = getDeckInfo combinedHp, combinedInfo, 1
        enemyFormation = 0
        enemyIntercept = 0
        enemyName = __ 'Enemy Vessel'
        result = __ 'Unknown'
        getShip = null
      @setState
        sortieHp: sortieHp
        enemyHp: enemyHp
        combinedHp: combinedHp
        sortieInfo: sortieInfo
        enemyInfo: enemyInfo
        combinedInfo: combinedInfo
        getShip: getShip
        enemyFormation: enemyFormation
        enemyIntercept: enemyIntercept
        enemyName: enemyName
        result: result
        enableProphetDamaged: enableProphetDamaged
        prophetCondShow: prophetCondShow
        combinedFlag: combinedFlag

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
          prophetCondShow={@state.prophetCondShow}
          HP={__ "HP"}
          sortieFleet={__ "Sortie Fleet"}
          enemyName={@state.enemyName}
          cols={if @state.combinedFlag == 0 then 0 else 1}
          lay={if layout == 'horizonal' || window.doubleTabbed then 0 else 1} />
        <BottomAlert
          admiral={__ "Admiral"}
          getShip={@state.getShip}
          joinFleet={__ "Join fleet"}
          formationNum={@state.enemyFormation}
          formation={formation[@state.enemyFormation]}
          intercept={intercept[@state.enemyIntercept]}
          result={@state.result} />
      </div>
  settingsClass: React.createClass
    getInitialState: ->
      enableProphetDamaged: config.get 'plugin.prophet.notify.damaged'
      prophetCondShow: config.get 'plugin.prophet.show.cond'
    handleSetProphetDamaged: ->
      enabled = @state.enableProphetDamaged
      config.set 'plugin.prophet.notify.damaged', !enabled
      @setState
        enableProphetDamaged: !enabled
    handleSetProphetCond: ->
      enabled = @state.prophetCondShow
      config.set 'plugin.prophet.show.cond', !enabled
      @setState
        prophetCondShow: !enabled
    render: ->
      <div className="form-group">
        <Divider text="未卜先知" />
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
