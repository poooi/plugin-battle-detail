path = require 'path-extra'
{relative, join} = require 'path-extra'
{_, $, $$, React, ReactBootstrap, ROOT, resolveTime, layout, toggleModal} = window
fs = require 'fs-extra'
{Table, ProgressBar, Grid, Input, Col, Alert} = ReactBootstrap

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

enemyPath = path.join(__dirname, 'assets', 'enemyinfo.json')
db = fs.readJsonSync(enemyPath, 'utf8')
enemyInformation = {}
if db?
  enemyInformation = db
jsonId = null
jsonContent = {}

getTyku = (ship, slot) ->
  totalTyku = 0
  {$slotitems, $ships} = window
  for tmp, i in ship
    continue if tmp == -1
    for t, j in $ships[tmp].api_maxeq
      continue if t == 0
      item = $slotitems[slot[i][j]]
      if item.api_type[3] in [6, 7, 8]
        totalTyku += Math.floor(Math.sqrt(item.api_tyku * t))
      else if item.api_type[3] == 10 && item.api_type[2] == 11
        totalTyku += Math.floor(Math.sqrt(item.api_tyku * t))
  totalTyku

updateJson = (jsonId, jsonContent) ->
  if jsonContent?
    enemyInformation[jsonId] = jsonContent
    fs.writeJsonSync enemyPath, enemyInformation, 'utf8'
  null

getMapEnemy = (shipName, shipLv, maxHp, enemyState, enemyInfo) ->
  {$ships, _ships} = window
  for tmp, i in enemyInfo.ship
    continue if tmp == -1
    maxHp[i + 6] = enemyInfo.hp[i]
    shipLv[i + 6] = enemyInfo.lv[i]
    if $ships[tmp].api_yomi != "-"
      shipName[i + 6] = $ships[tmp].api_name + $ships[tmp].api_yomi
    else
      shipName[i + 6] = $ships[tmp].api_name
  enemyState = [enemyInfo.formation, enemyInfo.totalTyku]
  [shipName, shipLv, maxHp, enemyState]

getInfo = (shipName, shipLv, friend, enemy, enemyLv) ->
  {$ships, _ships} = window
  for shipId, i in friend
    continue if shipId == -1
    idx = _.sortedIndex _ships, {api_id: shipId}, 'api_id'
    shipName[i] = $ships[_ships[idx].api_ship_id].api_name
    shipLv[i] = _ships[idx].api_lv
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

module.exports =
  name: 'prophet'
  priority: 0.1
  displayName: [<FontAwesome key={0} name='compass' />, ' 未卜先知']
  description: '战况预知'
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
      beforeAttack: null
      enemyState: [0, 0]
    handleResponse: (e) ->
      {method, path, body, postBody} = e.detail
      {afterHp, nowHp, maxHp, damageHp, shipName, shipLv, enemyInfo, getShip, beforeAttack, enemyState} = @state
      flag = false
      switch path
        when '/kcsapi/api_req_map/start'
          jsonId = null
          beforeAttack = 1
          flag = true
          for tmp, i in shipLv
            shipLv[i] = -1
            maxHp[i] = 0
            nowHp[i] = 0
            afterHp[i] = 0
            damageHp[i] = 0
          getShip = null
          if body.api_enemy?
            if enemyInformation[body.api_enemy.api_enemy_id]?
              [shipName, shipLv, maxHp, enemyState] = getMapEnemy shipName, shipLv, maxHp, enemyState, enemyInformation[body.api_enemy.api_enemy_id]
              nowHp = maxHp
              afterHp = maxHp
            else
              jsonId = body.api_enemy.api_enemy_id

        when '/kcsapi/api_req_map/next'
          jsonId = null
          beforeAttack = 1
          flag = true
          nowHp = Object.clone afterHp
          for tmp, i in shipLv
            damageHp[i] = 0
          getShip = null
          if body.api_enemy?
            if enemyInformation[body.api_enemy.api_enemy_id]?
              [shipName, shipLv, maxHp, enemyState] = getMapEnemy shipName, shipLv, maxHp, enemyState, enemyInformation[body.api_enemy.api_enemy_id]
              nowHp = maxHp
              afterHp = maxHp
            else
              jsonId = body.api_enemy.api_enemy_id

        when '/kcsapi/api_req_sortie/battle'
          beforeAttack = null
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
          beforeAttack = null
          flag = true
          nowHp = Object.clone afterHp
          if body.api_hougeki?
            afterHp = hougekiAttack afterHp, body.api_hougeki
          damageHp = getDamage damageHp, nowHp, afterHp, 0

        when '/kcsapi/api_req_practice/battle'
          beforeAttack = null
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
          beforeAttack = null
          flag = true
          nowHp = Object.clone afterHp
          if body.api_hougeki?
            afterHp = hougekiAttack afterHp, body.api_hougeki
          damageHp = getDamage damageHp, nowHp, afterHp, 1

        when '/kcsapi/api_req_battle_midnight/sp_midnight'
          beforeAttack = null
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
          if body.api_hougeki?
            afterHp = hougekiAttack afterHp, body.api_hougeki
          damageHp = getDamage damageHp, nowHp, afterHp, 0

        when '/kcsapi/api_req_sortie/airbattle'
          beforeAttack = null
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
          if body.api_kouku?
            afterHp = koukuAttack afterHp, body.api_kouku.api_stage3
          if body.api_kouku2?
            afterHp = koukuAttack afterHp, body.api_kouku2.api_stage3
          damageHp = getDamage damageHp, nowHp, afterHp, 0

        when '/kcsapi/api_req_sortie/battleresult'
          beforeAttack = null
          flag = true
          if jsonId?
            jsonId = updateJson jsonId, jsonContent
          if body.api_get_ship?
            enemyInfo = body.api_enemy_info
            getShip = body.api_get_ship
          else
            enemyInfo = null
            getShip = null

      return unless flag
      @setState
        afterHp: afterHp
        nowHp: nowHp
        maxHp: maxHp
        shipName: shipName
        shipLv: shipLv
        enemyInfo: enemyInfo
        getShip: getShip
        beforeAttack: beforeAttack
        enemyState: enemyState

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
            else if @state.beforeAttack?
              "提督さん、 敵陣形「#{formation[@state.enemyState[0]]}」敵制空値「#{@state.enemyState[1]}」"
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
            else if @state.beforeAttack?
              "提督さん、 敵陣形「#{formation[@state.enemyState[0]]}」敵制空値「#{@state.enemyState[1]}」"
          }
          </Alert>
        </div>
