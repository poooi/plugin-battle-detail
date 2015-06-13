Promise = require 'bluebird'
async = Promise.coroutine
request = Promise.promisifyAll require('request')
{relative, join} = require 'path-extra'
fs = require 'fs-extra'
{_, $, $$, React, ReactBootstrap, ROOT, resolveTime, layout, toggleModal} = window
{Table, ProgressBar, Grid, Input, Col, Alert} = ReactBootstrap
{APPDATA_PATH, SERVER_HOSTNAME} = window

window.addEventListener 'layout.change', (e) ->
  {layout} = e.detail

getHpStyle = (percent) ->
  if percent <= 25
    'danger'
  else if percent <= 50
    'warning'
  else if percent <= 75
    'info'
  else
    'success'

formation = [
  "陣形不明",
  "単縦陣",
  "複縦陣",
  "輪形陣",
  "梯形陣",
  "単横陣",
  "第一警戒航行序列",
  "第二警戒航行序列",
  "第三警戒航行序列",
  "第四警戒航行序列"
]

enemyPath = join(APPDATA_PATH, 'enemyinfo.json')
db = null
try
  db = fs.readJsonSync(enemyPath, 'utf8')
catch e
  false
enemyInformation = {}
if db?
  enemyInformation = db
# Sync from SERVER
sync = async ->
  [response, body] = yield request.getAsync "http://#{SERVER_HOSTNAME}/api/prophet/sync",
    json: true
  if response.statusCode == 200
    enemyInformation = _.extend enemyInformation, body.data
sync()

jsonId = null
jsonContent = {}

getTyku = (ship, slot) ->
  totalTyku = 0
  {$slotitems, $ships} = window
  for tmp, i in ship
    continue if tmp == -1
    for t, j in $ships[tmp].api_maxeq
      continue if t == 0
      continue if slot[i][j] == -1
      item = $slotitems[slot[i][j]]
      if item.api_type[3] in [6, 7, 8]
        totalTyku += Math.floor(Math.sqrt(t) * item.api_tyku)
      else if item.api_type[3] == 10 && item.api_type[2] == 11
        totalTyku += Math.floor(Math.sqrt(t) * item.api_tyku)
  totalTyku

updateJson = async (jsonId, jsonContent) ->
  if jsonContent?
    enemyInformation[jsonId] = Object.clone jsonContent
    fs.writeFileSync enemyPath, JSON.stringify(enemyInformation), 'utf8'
    try
      yield request.postAsync "http://#{SERVER_HOSTNAME}/api/prophet/#{jsonId}/update",
        form:
          data: JSON.stringify(jsonContent)
    catch e
      console.error e
  null

getMapEnemy = (shipName, shipLv, maxHp, nowHp, enemyFormation, enemyTyku, enemyInfo) ->
  {$ships, _ships} = window
  for tmp, i in enemyInfo.ship
    continue if tmp == -1
    maxHp[i + 6] = enemyInfo.hp[i]
    shipLv[i + 6] = enemyInfo.lv[i]
    nowHp[i + 6] = maxHp[i + 6]
    if $ships[tmp].api_yomi != "-"
      shipName[i + 6] = $ships[tmp].api_name + $ships[tmp].api_yomi
    else
      shipName[i + 6] = $ships[tmp].api_name
  enemyFormation = enemyInfo.formation
  enemyTyku = enemyInfo.totalTyku
  [shipName, shipLv, maxHp, nowHp, enemyFormation, enemyTyku]

getInfo = (shipName, shipLv, friend, enemy, enemyLv) ->
  {$ships, _ships} = window
  for shipId, i in friend
    continue if shipId == -1
    shipName[i] = $ships[_ships[shipId].api_ship_id].api_name
    shipLv[i] = _ships[shipId].api_lv
  for shipId, i in enemy
    continue if shipId == -1
    shipLv[i + 5] = enemyLv[i]
    if $ships[shipId].api_yomi == "-"
      shipName[i + 5] = $ships[shipId].api_name
    else
      shipName[i + 5] = $ships[shipId].api_name + $ships[shipId].api_yomi
  [shipName, shipLv]

getHp = (maxHp, nowHp, maxHps, nowHps) ->
  for tmp, i in maxHps
    continue if i == 0
    maxHp[i - 1] = tmp
    nowHp[i - 1] = nowHps[i]
  [maxHp, nowHp]

koukuAttack = (afterHp, kouku) ->
  if kouku.api_edam?
    for damage, i in kouku.api_edam
      damage = Math.floor(damage)
      continue if damage <= 0
      afterHp[i + 5] -= damage
  if kouku.api_fdam?
    for damage, i in kouku.api_fdam
      damage = Math.floor(damage)
      continue if damage <= 0
      afterHp[i - 1] -= damage
  afterHp

openAttack = (afterHp, openingAttack) ->
  if openingAttack.api_edam?
    for damage, i in openingAttack.api_edam
      damage = Math.floor(damage)
      continue if damage <= 0
      afterHp[i + 5] -= damage
  if openingAttack.api_fdam?
    for damage, i in openingAttack.api_fdam
      damage = Math.floor(damage)
      continue if damage <= 0
      afterHp[i - 1] -= damage
  afterHp

hougekiAttack = (afterHp, hougeki) ->
  for damageFrom, i in hougeki.api_at_list
    continue if damageFrom == -1
    for damage, j in hougeki.api_damage[i]
      damage = Math.floor(damage)
      damageTo = hougeki.api_df_list[i][j]
      continue if damage <= 0
      afterHp[damageTo - 1] -= damage
  afterHp

raigekiAttack = (afterHp, raigeki) ->
  if raigeki.api_edam?
    for damage, i in raigeki.api_edam
      damage = Math.floor(damage)
      continue if damage <= 0
      afterHp[i + 5] -= damage
  if raigeki.api_fdam?
    for damage, i in raigeki.api_fdam
      damage = Math.floor(damage)
      continue if damage <= 0
      afterHp[i - 1] -= damage
  afterHp

getDamage = (damageHp, nowHp, afterHp, minHp) ->
  for tmp, i in afterHp
    if minHp == 1
      afterHp[i] = Math.max(tmp, minHp)
    damageHp[i] = nowHp[i] - afterHp[i]
    afterHp[i] = Math.max(tmp, minHp)
  damageHp

supportAttack = (afterHp, damages) ->
  for damage, i in damages
    damage = Math.floor(damage)
    continue if damage <= 0
    afterHp[i + 5] -= damage
  afterHp

formationFlag = false

module.exports =
  name: 'prophet'
  priority: 1
  displayName: [<FontAwesome key={0} name='compass' />, ' 未卜先知']
  description: '战况预知'
  version: '1.1.0'
  author: 'Chiba'
  link: 'https://github.com/Chibaheit'
  reactClass: React.createClass
    getInitialState: ->
      afterHp: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      nowHp: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      maxHp: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      damageHp: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      shipName: ["空", "空", "空", "空", "空", "空", "空", "空", "空", "空", "空", "空"]
      shipLv: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
      enemyInfo: null
      getShip: null
      enemyFormation: 0
      enemyTyku: 0
    handleResponse: (e) ->
      {method, path, body, postBody} = e.detail
      {afterHp, nowHp, maxHp, damageHp, shipName, shipLv, enemyInfo, getShip, enemyFormation, enemyTyku} = @state
      if path == '/kcsapi/api_req_map/start' || formationFlag
        @setState
          enemyInformation: 0
          enemyTyku: 0
        formationFlag = false
      flag = false
      switch path
        when '/kcsapi/api_req_map/start'
          jsonId = null
          flag = true
          shipLv[i] = -1 for i in [0..11]
          _deck = window._decks[postBody.api_deck_id - 1]
          {_ships} = window
          for shipId, i in _deck.api_ship
            continue if shipId == -1
            shipName[i] = _ships[shipId].api_name
            shipLv[i] = _ships[shipId].api_lv
            maxHp[i] = _ships[shipId].api_maxhp
            nowHp[i] = _ships[shipId].api_nowhp
            afterHp[i] = _ships[shipId].api_nowhp
          for tmp, i in shipLv
            damageHp[i] = 0
          getShip = null
          if body.api_enemy?
            if enemyInformation[body.api_enemy.api_enemy_id]?
              [shipName, shipLv, maxHp, nowHp, enemyFormation, enemyTyku] = getMapEnemy shipName, shipLv, maxHp, nowHp, enemyFormation, enemyTyku, enemyInformation[body.api_enemy.api_enemy_id]
              afterHp = Object.clone nowHp
            else
              jsonId = body.api_enemy.api_enemy_id

        when '/kcsapi/api_req_map/next'
          jsonId = null
          flag = true
          for tmp, i in shipLv
            damageHp[i] = 0
          getShip = null
          shipLv[i] = -1 for i in [6..11]
          nowHp = Object.clone afterHp
          if body.api_enemy?
            if enemyInformation[body.api_enemy.api_enemy_id]?
              [shipName, shipLv, maxHp, nowHp, enemyFormation, enemyTyku] = getMapEnemy shipName, shipLv, maxHp, nowHp, enemyFormation, enemyTyku, enemyInformation[body.api_enemy.api_enemy_id]
              afterHp = Object.clone afterHp
            else
              jsonId = body.api_enemy.api_enemy_id

        when '/kcsapi/api_req_sortie/battle'
          for tmp, i in shipLv
            shipLv[i] = -1
          {_decks} = window
          flag = true
          [shipName, shipLv] = getInfo shipName, shipLv, _decks[body.api_dock_id - 1].api_ship, body.api_ship_ke, body.api_ship_lv
          [maxHp, nowHp] = getHp maxHp, nowHp, body.api_maxhps, body.api_nowhps
          afterHp = Object.clone nowHp
          getShip = null
          if jsonId?
            jsonContent.ship = Object.clone body.api_ship_ke
            jsonContent.ship.splice 0, 1
            jsonContent.lv = Object.clone body.api_ship_lv
            jsonContent.lv.splice 0, 1
            jsonContent.formation = body.api_formation[1]
            jsonContent.totalTyku = getTyku jsonContent.ship, body.api_eSlot
            jsonContent.hp = Object.clone maxHp
            jsonContent.hp.splice 0, 6
            enemyFormation = jsonContent.formation
            enemyTyku = jsonContent.totalTyku
          if body.api_kouku.api_stage3?
            afterHp = koukuAttack afterHp, body.api_kouku.api_stage3
          if body.api_opening_atack?
            afterHp = openAttack afterHp, body.api_opening_atack
          if body.api_hougeki1?
            afterHp = hougekiAttack afterHp, body.api_hougeki1
          if body.api_hougeki2?
            afterHp = hougekiAttack afterHp, body.api_hougeki2
          if body.api_hougeki3?
            afterHp = hougekiAttack afterHp, body.api_hougeki3
          if body.api_raigeki?
            afterHp = raigekiAttack afterHp, body.api_raigeki
          if body.api_support_info?
            afterHp = supportAttack afterHp, body.api_support_info.api_damage
          damageHp = getDamage damageHp, nowHp, afterHp, 0

        when '/kcsapi/api_req_battle_midnight/battle'
          flag = true
          nowHp = Object.clone afterHp
          if body.api_hougeki?
            afterHp = hougekiAttack afterHp, body.api_hougeki
          damageHp = getDamage damageHp, nowHp, afterHp, 0

        when '/kcsapi/api_req_practice/battle'
          for tmp, i in shipLv
            shipLv[i] = -1
          {_decks} = window
          flag = true
          getShip = null
          [shipName, shipLv] = getInfo shipName, shipLv, _decks[body.api_dock_id - 1].api_ship, body.api_ship_ke, body.api_ship_lv
          [maxHp, nowHp] = getHp maxHp, nowHp, body.api_maxhps, body.api_nowhps
          afterHp = Object.clone nowHp
          if body.api_kouku.api_stage3?
            afterHp = koukuAttack afterHp, body.api_kouku.api_stage3
          if body.api_opening_atack?
            afterHp = openAttack afterHp, body.api_opening_atack
          if body.api_hougeki1?
            afterHp = hougekiAttack afterHp, body.api_hougeki1
          if body.api_hougeki2?
            afterHp = hougekiAttack afterHp, body.api_hougeki2
          if body.api_hougeki3?
            afterHp = hougekiAttack afterHp, body.api_hougeki3
          if body.api_raigeki?
            afterHp = raigekiAttack afterHp, body.api_raigeki
          damageHp = getDamage damageHp, nowHp, afterHp, 1

        when '/kcsapi/api_req_practice/midnight_battle'
          flag = true
          nowHp = Object.clone afterHp
          if body.api_hougeki?
            afterHp = hougekiAttack afterHp, body.api_hougeki
          damageHp = getDamage damageHp, nowHp, afterHp, 1


        when '/kcsapi/api_req_battle_midnight/sp_midnight'
          for tmp, i in shipLv
            shipLv[i] = -1
          {_decks} = window
          flag = true
          getShip = null
          [shipName, shipLv] = getInfo shipName, shipLv, _decks[body.api_deck_id - 1].api_ship, body.api_ship_ke, body.api_ship_lv
          [maxHp, nowHp] = getHp maxHp, nowHp, body.api_maxhps, body.api_nowhps
          afterHp = Object.clone nowHp
          if jsonId?
            jsonContent.ship = Object.clone body.api_ship_ke
            jsonContent.ship.splice 0, 1
            jsonContent.lv = Object.clone body.api_ship_lv
            jsonContent.lv.splice 0, 1
            jsonContent.formation = body.api_formation[1]
            jsonContent.totalTyku = getTyku jsonContent.ship, body.api_eSlot
            jsonContent.hp = Object.clone maxHp
            jsonContent.hp.splice 0, 6
            enemyFormation = jsonContent.formation
            enemyTyku = jsonContent.totalTyku
          if body.api_hougeki?
            afterHp = hougekiAttack afterHp, body.api_hougeki
          damageHp = getDamage damageHp, nowHp, afterHp, 0

        when '/kcsapi/api_req_sortie/airbattle'
          for tmp, i in shipLv
            shipLv[i] = -1
          {_decks} = window
          flag = true
          getShip = null
          [shipName, shipLv] = getInfo shipName, shipLv, _decks[body.api_deck_id - 1].api_ship, body.api_ship_ke, body.api_ship_lv
          [maxHp, nowHp] = getHp maxHp, nowHp, body.api_maxhps, body.api_nowhps
          afterHp = Object.clone nowHp
          if jsonId?
            jsonContent.ship = Object.clone body.api_ship_ke
            jsonContent.ship.splice 0, 1
            jsonContent.lv = Object.clone body.api_ship_lv
            jsonContent.lv.splice 0, 1
            jsonContent.formation = body.api_formation[1]
            jsonContent.totalTyku = getTyku jsonContent.ship, body.api_eSlot
            jsonContent.hp = Object.clone maxHp
            jsonContent.hp.splice 0, 6
            enemyFormation = jsonContent.formation
            enemyTyku = jsonContent.totalTyku
          if body.api_kouku?
            afterHp = koukuAttack afterHp, body.api_kouku.api_stage3
          if body.api_kouku2?
            afterHp = koukuAttack afterHp, body.api_kouku2.api_stage3
          damageHp = getDamage damageHp, nowHp, afterHp, 0

        when '/kcsapi/api_req_sortie/battleresult'
          flag = true
          if jsonId?
            updateJson jsonId, jsonContent
          if body.api_get_ship?
            enemyInfo = body.api_enemy_info
            getShip = body.api_get_ship
          else
            enemyInfo = null
            getShip = null
          formationFlag = true

      return unless flag
      @setState
        afterHp: afterHp
        nowHp: nowHp
        maxHp: maxHp
        shipName: shipName
        shipLv: shipLv
        enemyInfo: enemyInfo
        getShip: getShip
        enemyFormation: enemyFormation
        enemyTyku: enemyTyku

    componentDidMount: ->
      window.addEventListener 'game.response', @handleResponse

    render: ->
      if layout == 'horizonal'
        <div>
          <link rel="stylesheet" href={join(relative(ROOT, __dirname), 'assets', 'prophet.css')} />
          <Alert>
            <Grid>
              <Col xs={4}>舰名</Col>
              <Col xs={4}>战前</Col>
              <Col xs={4}>战后</Col>
            </Grid>
          </Alert>
          <Table>
            <tbody>
            {
              for tmpName, i in @state.shipName
                continue unless @state.shipLv[i] != -1
                continue unless i < 6
                <tr key={i + 1}>
                  <td>Lv. {@state.shipLv[i]} - {tmpName}</td>
                  <td className="hp-progress">
                    <ProgressBar bsStyle={getHpStyle @state.nowHp[i] / @state.maxHp[i] * 100}
                      now={@state.nowHp[i] / @state.maxHp[i] * 100}
                      label={"#{@state.nowHp[i]} / #{@state.maxHp[i]}"} />
                  </td>
                  <td className="hp-progress">
                    <ProgressBar bsStyle={getHpStyle @state.afterHp[i] / @state.maxHp[i] * 100}
                      now={@state.afterHp[i] / @state.maxHp[i] * 100}
                      label={if @state.damageHp[i] > 0 then "#{@state.afterHp[i]} / #{@state.maxHp[i]} (-#{@state.damageHp[i]})" else "#{@state.afterHp[i]} / #{@state.maxHp[i]}"} />
                  </td>
                </tr>
            }
            </tbody>
          </Table>
          <Alert>
            <Grid>
              <Col xs={4}>舰名</Col>
              <Col xs={4}>战前</Col>
              <Col xs={4}>战后</Col>
            </Grid>
          </Alert>
          <Table>
            <tbody>
            {
              for tmpName, i in @state.shipName
                continue unless @state.shipLv[i] != -1
                continue unless i >= 6
                <tr key={i}>
                  <td>Lv. {@state.shipLv[i]} - {tmpName}</td>
                  <td className="hp-progress">
                    <ProgressBar bsStyle={getHpStyle @state.nowHp[i] / @state.maxHp[i] * 100}
                      now={@state.nowHp[i] / @state.maxHp[i] * 100}
                      label={"#{@state.nowHp[i]} / #{@state.maxHp[i]}"} />
                  </td>
                  <td className="hp-progress">
                    <ProgressBar bsStyle={getHpStyle @state.afterHp[i] / @state.maxHp[i] * 100}
                      now={@state.afterHp[i] / @state.maxHp[i] * 100}
                      label={if @state.damageHp[i] > 0 then "#{@state.afterHp[i]} / #{@state.maxHp[i]} (-#{@state.damageHp[i]})" else "#{@state.afterHp[i]} / #{@state.maxHp[i]}"} />
                  </td>
                </tr>
            }
            </tbody>
          </Table>
          <Alert>
          {
            if @state.getShip? && @state.enemyInfo?
              "提督さん、#{@state.getShip.api_ship_type}「#{@state.getShip.api_ship_name}」が戦列に加わりました"
            else
              "提督さん、 敵陣形「#{formation[@state.enemyFormation]}」敵制空値「#{@state.enemyTyku}」"
          }
          </Alert>
        </div>
      else
        <div>
          <link rel="stylesheet" href={join(relative(ROOT, __dirname), 'assets', 'prophet.css')} />
          <Alert>
            <Grid>
              <Col xs={2}>舰名</Col>
              <Col xs={2}>战前</Col>
              <Col xs={2}>战后</Col>
              <Col xs={2}>舰名</Col>
              <Col xs={2}>战前</Col>
              <Col xs={2}>战后</Col>
            </Grid>
          </Alert>
          <Table>
            <tbody>
            {
              for tmpName, i in @state.shipName
                continue if (@state.shipLv[i] == -1 && @state.shipLv[i + 6] == -1)
                continue if i >= 6
                list = []
                if @state.shipLv[i] == -1
                  for j in [0..2]
                    list.push <td>　</td>
                else
                  list.push <td>Lv. {@state.shipLv[i]} - {tmpName}</td>
                  list.push <td className="hp-progress"><ProgressBar bsStyle={getHpStyle @state.nowHp[i] / @state.maxHp[i] * 100} now={@state.nowHp[i] / @state.maxHp[i] * 100} label={"#{@state.nowHp[i]} / #{@state.maxHp[i]}"} /></td>
                  list.push <td className="hp-progress"><ProgressBar bsStyle={getHpStyle @state.afterHp[i] / @state.maxHp[i] * 100} now={@state.afterHp[i] / @state.maxHp[i] * 100} label={if @state.damageHp[i] > 0 then "#{@state.afterHp[i]} / #{@state.maxHp[i]} (-#{@state.damageHp[i]})" else "#{@state.afterHp[i]} / #{@state.maxHp[i]}"} /></td>
                if @state.shipLv[i + 6] == -1
                  for j in [0..2]
                    list.push <td>　</td>
                else
                  list.push <td>Lv. {@state.shipLv[i + 6]} - {@state.shipName[i + 6]}</td>
                  list.push <td className="hp-progress"><ProgressBar bsStyle={getHpStyle @state.nowHp[i + 6] / @state.maxHp[i + 6] * 100} now={@state.nowHp[i + 6] / @state.maxHp[i + 6] * 100} label={"#{@state.nowHp[i + 6]} / #{@state.maxHp[i + 6]}"} /></td>
                  list.push <td className="hp-progress"><ProgressBar bsStyle={getHpStyle @state.afterHp[i + 6] / @state.maxHp[i + 6] * 100} now={@state.afterHp[i + 6] / @state.maxHp[i + 6] * 100} label={if @state.damageHp[i + 6] > 0 then "#{@state.afterHp[i + 6]} / #{@state.maxHp[i + 6]} (-#{@state.damageHp[i + 6]})" else "#{@state.afterHp[i + 6]} / #{@state.maxHp[i + 6]}"} /></td>
                continue if (@state.shipLv[i] == -1 && @state.shipLv[i + 6] == -1)
                <tr key={i}>
                  {list}
                </tr>
            }
            </tbody>
          </Table>
          <Alert>
          {
            if @state.getShip? && @state.enemyInfo?
              "提督さん、#{@state.getShip.api_ship_type}「#{@state.getShip.api_ship_name}」が戦列に加わりました"
            else
              "提督さん、 敵陣形「#{formation[@state.enemyFormation]}」敵制空値「#{@state.enemyTyku}」"
          }
          </Alert>
        </div>
