path = require 'path-extra'
{relative, join} = require 'path-extra'
{_, $, $$, React, ReactBootstrap, ROOT, resolveTime, layout, toggleModal} = window

{Table, ProgressBar, Grid, Input, Col, Alert} = ReactBootstrap
getHpStyle = (percent) ->
  if percent <= 25
    'danger'
  else if percent <= 50
    'warning'
  else if percent <= 75
    'info'
  else
    'success'

window.addEventListener 'layout.change', (e) ->
  {layout} = e.detail

module.exports =
  name: 'prophet'
  priority: 0.1
  displayName: [<FontAwesome key={0} name='compass' />, ' 未卜先知']
  description: '战况预知'
  reactClass: React.createClass
    getInitialState: ->
      afterFriendHp: [0, 0, 0, 0, 0, 0]
      nowFriendHp: [0, 0, 0, 0, 0, 0]
      maxFriendHp: [0, 0, 0, 0, 0, 0]
      afterEnemyHp: [0, 0, 0, 0, 0, 0]
      nowEnemyHp: [0, 0, 0, 0, 0, 0]
      maxEnemyHp: [0, 0, 0, 0, 0, 0]
      damageFriend: [0, 0, 0, 0, 0, 0]
      damageEnemy: [0, 0, 0, 0, 0, 0]
      enemyShipName: ["空", "空", "空", "空", "空", "空"]
      enemyShipLv: [-1, -1, -1, -1, -1, -1]
      friendShipName: ["空", "空", "空", "空", "空", "空"]
      friendShipLv: [-1, -1, -1, -1, -1, -1]
    handleResponse: (e) ->
      {method, path, body, postBody} = e.detail
      {afterFriendHp, nowFriendHp, maxFriendHp, afterEnemyHp, nowEnemyHp, maxEnemyHp, damageFriend, damageEnemy, enemyShipName, enemyShipLv, friendShipName, friendShipLv} = @state
      flag = false
      switch path
        when '/kcsapi/api_req_sortie/battle'
          for tmp, i in enemyShipLv
            enemyShipLv[i] = -1
          for tmp in friendShipLv
            friendShipLv[i] = -1
          {$ships, _ships, _decks} = window
          flag = true
          for shipId, i in _decks[body.api_dock_id - 1].api_ship
            continue if shipId == -1
            idx = _.sortedIndex _ships, {api_id: shipId}, 'api_id'
            friendShipName[i] = $ships[_ships[idx].api_ship_id].api_name
            friendShipLv[i] = _ships[idx].api_lv
          for enemyShipIdx, i in body.api_ship_ke
            continue if enemyShipIdx == -1
            if $ships[enemyShipIdx].api_yomi == "-"
              enemyShipName[i - 1] = $ships[enemyShipIdx].api_name
            else
              enemyShipName[i - 1] = $ships[enemyShipIdx].api_name + $ships[enemyShipIdx].api_yomi
            enemyShipLv[i - 1] = body.api_ship_lv[i]
          for maxHp, i in body.api_maxhps
            continue if i == 0
            if i <= 6
              maxFriendHp[i - 1] = maxHp
            else
              maxEnemyHp[i - 7] = maxHp
          for nowHp, i in body.api_nowhps
            continue if i == 0
            if i <= 6
              nowFriendHp[i - 1] = nowHp
              afterFriendHp[i - 1] = nowHp
            else
              nowEnemyHp[i - 7] = nowHp
              afterEnemyHp[i - 7] = nowHp
          if body.api_kouku.api_stage3?
            kouku = body.api_kouku.api_stage3
            if kouku.api_edam?
              for damage, target in kouku.api_edam
                damage = Math.floor(damage)
                continue if damage <= 0
                afterEnemyHp[target - 1] -= damage
            if kouku.api_fdam?
              for damage, target in kouku.api_fdam
                damage = Math.floor(damage)
                continue if damage <= 0
                afterFriendHp[target - 1] -= damage
          if body.api_opening_atack?
            openingAttack = body.api_opening_atack
            if openingAttack.api_edam?
              for damage, target in openingAttack.api_edam
                damage = Math.floor(damage)
                continue if damage <= 0
                afterEnemyHp[target - 1] -= damage
            if openingAttack.api_fdam?
              for damage, target in openingAttack.api_fdam
                damage = Math.floor(damage)
                continue if damage <= 0
                afterFriendHp[target - 1] -= damage
          if body.api_hougeki1?
            hougeki = body.api_hougeki1
            for damageFrom, i in hougeki.api_at_list
              continue if damageFrom == -1
              for damage, j in hougeki.api_damage[i]
                damage = Math.floor(damage)
                damageTo = hougeki.api_df_list[i][j]
                if damageTo <= 6
                  afterFriendHp[damageTo - 1] -= damage
                else
                  afterEnemyHp[damageTo - 7] -= damage
          if body.api_hougeki2?
            hougeki = body.api_hougeki2
            for damageFrom, i in hougeki.api_at_list
              continue if damageFrom == -1
              for damage, j in hougeki.api_damage[i]
                damage = Math.floor(damage)
                damageTo = hougeki.api_df_list[i][j]
                if damageTo <= 6
                  afterFriendHp[damageTo - 1] -= damage
                else
                  afterEnemyHp[damageTo - 7] -= damage
          if body.api_hougeki3?
            hougeki = body.api_hougeki3
            for damageFrom, i in hougeki.api_at_list
              continue if damageFrom == -1
              for damage, j in hougeki.api_damage[i]
                damage = Math.floor(damage)
                damageTo = hougeki.api_df_list[i][j]
                if damageTo <= 6
                  afterFriendHp[damageTo - 1] -= damage
                else
                  afterEnemyHp[damageTo - 7] -= damage
          if body.api_raigeki?
            raigeki = body.api_raigeki
            if raigeki.api_edam?
              for damage, target in raigeki.api_edam
                damage = Math.floor(damage)
                continue if damage <= 0
                afterEnemyHp[target - 1] -= damage
            if raigeki.api_fdam?
              for damage, target in raigeki.api_fdam
                damage = Math.floor(damage)
                continue if damage <= 0
                afterFriendHp[target - 1] -= damage
          for tmp, i in afterFriendHp
            damageFriend[i] = nowFriendHp[i] - afterFriendHp[i]
            afterFriendHp[i] = Math.max(tmp, 0)
          for tmp, i in afterEnemyHp
            damageEnemy[i] = nowEnemyHp[i] - afterEnemyHp[i]
            afterEnemyHp[i] = Math.max(tmp, 0)

        when '/kcsapi/api_req_battle_midnight/battle'
          flag = true
          nowFriendHp = Object.clone afterFriendHp
          nowEnemyHp = Object.clone afterEnemyHp
          if body.api_hougeki?
            hougeki = body.api_hougeki
            for damageFrom, i in hougeki.api_at_list
              continue if damageFrom == -1
              for damage, j in hougeki.api_damage[i]
                damage = Math.floor(damage)
                damageTo = hougeki.api_df_list[i][j]
                if damageTo <= 6
                  afterFriendHp[damageTo - 1] -= damage
                else
                  afterEnemyHp[damageTo - 7] -= damage
          for tmp, i in afterFriendHp
            damageFriend[i] = nowFriendHp[i] - afterFriendHp[i]
            afterFriendHp[i] = Math.max(tmp, 0)
          for tmp, i in afterEnemyHp
            damageEnemy[i] = nowEnemyHp[i] - afterEnemyHp[i]
            afterEnemyHp[i] = Math.max(tmp, 0)

        when '/kcsapi/api_req_sortie/battleresult'
          if body.api_get_ship?
            setTimeout log.bind(@, "提督くん、#{body.api_enemy_info.api_deck_name}で撃破しました、#{body.api_get_ship.api_ship_type} #{body.api_get_ship.api_ship_name}ゲット　o(*≧▽≦)ツ"), 500

      return unless flag
      @setState
        afterFriendHp: afterFriendHp
        nowFriendHp: nowFriendHp
        maxFriendHp: maxFriendHp
        afterEnemyHp: afterEnemyHp
        nowEnemyHp: nowEnemyHp
        maxEnemyHp: maxEnemyHp
        damageFriend: damageFriend
        damageEnemy: damageEnemy
        enemyShipName: enemyShipName
        enemyShipLv: enemyShipLv
        friendShipName: friendShipName
        friendShipLv: friendShipLv
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
              for shipName, i in @state.friendShipName
                continue unless @state.friendShipLv[i] != -1
                <tr key={i + 1}>
                  <td>Lv. {@state.friendShipLv[i]} - {shipName}</td>
                  <td className="hp-progress">
                    <ProgressBar bsStyle={getHpStyle @state.nowFriendHp[i] / @state.maxFriendHp[i] * 100}
                      now={@state.nowFriendHp[i] / @state.maxFriendHp[i] * 100}
                      label={"#{@state.nowFriendHp[i]} / #{@state.maxFriendHp[i]}"} />
                  </td>
                  <td className="hp-progress">
                    <ProgressBar bsStyle={getHpStyle @state.afterFriendHp[i] / @state.maxFriendHp[i] * 100}
                      now={@state.afterFriendHp[i] / @state.maxFriendHp[i] * 100}
                      label={if @state.damageFriend[i] > 0 then "#{@state.afterFriendHp[i]} / #{@state.maxFriendHp[i]} (-#{@state.damageFriend[i]})" else "#{@state.afterFriendHp[i]} / #{@state.maxFriendHp[i]}"} />
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
              for shipName, i in @state.enemyShipName
                continue unless @state.enemyShipLv[i] != -1
                <tr key={i + 8}>
                  <td>Lv. {@state.enemyShipLv[i]} - {shipName}</td>
                  <td className="hp-progress">
                    <ProgressBar bsStyle={getHpStyle @state.nowEnemyHp[i] / @state.maxEnemyHp[i] * 100}
                      now={@state.nowEnemyHp[i] / @state.maxEnemyHp[i] * 100}
                      label={"#{@state.nowEnemyHp[i]} / #{@state.maxEnemyHp[i]}"} />
                  </td>
                  <td className="hp-progress">
                    <ProgressBar bsStyle={getHpStyle @state.afterEnemyHp[i] / @state.maxEnemyHp[i] * 100}
                      now={@state.afterEnemyHp[i] / @state.maxEnemyHp[i] * 100}
                      label={if @state.damageEnemy[i] > 0 then "#{@state.afterEnemyHp[i]} / #{@state.maxEnemyHp[i]} (-#{@state.damageEnemy[i]})" else "#{@state.afterEnemyHp[i]} / #{@state.maxEnemyHp[i]}"} />
                  </td>
                </tr>
            }
            </tbody>
          </Table>
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
              for shipName, i in @state.friendShipName
                continue if (@state.friendShipLv[i] == -1 && @state.enemyShipLv[i] == -1)
                <tr key={i + 1}>
                  if @state.friendShipLv[i] != -1
                    <td>Lv. {@state.friendShipLv[i]} - {shipName}</td>
                    <td className="hp-progress">
                      <ProgressBar bsStyle={getHpStyle @state.nowFriendHp[i] / @state.maxFriendHp[i] * 100}
                        now={@state.nowFriendHp[i] / @state.maxFriendHp[i] * 100}
                        label={"#{@state.nowFriendHp[i]} / #{@state.maxFriendHp[i]}"} />
                    </td>
                    <td className="hp-progress">
                      <ProgressBar bsStyle={getHpStyle @state.afterFriendHp[i] / @state.maxFriendHp[i] * 100}
                        now={@state.afterFriendHp[i] / @state.maxFriendHp[i] * 100}
                        label={if @state.damageFriend[i] > 0 then "#{@state.afterFriendHp[i]} / #{@state.maxFriendHp[i]} (-#{@state.damageFriend[i]})" else "#{@state.afterFriendHp[i]} / #{@state.maxFriendHp[i]}"} />
                    </td>
                  else
                    <td>　</td>
                    <td>　</td>
                    <td>　</td>
                  if @state.enemyShipLv[i] != -1
                    <td>Lv. {@state.enemyShipLv[i]} - {@state.enemyShipName[i]}</td>
                    <td className="hp-progress">
                      <ProgressBar bsStyle={getHpStyle @state.nowEnemyHp[i] / @state.maxEnemyHp[i] * 100}
                        now={@state.nowEnemyHp[i] / @state.maxEnemyHp[i] * 100}
                        label={"#{@state.nowEnemyHp[i]} / #{@state.maxEnemyHp[i]}"} />
                    </td>
                    <td className="hp-progress">
                      <ProgressBar bsStyle={getHpStyle @state.afterEnemyHp[i] / @state.maxEnemyHp[i] * 100}
                        now={@state.afterEnemyHp[i] / @state.maxEnemyHp[i] * 100}
                        label={if @state.damageEnemy[i] > 0 then "#{@state.afterEnemyHp[i]} / #{@state.maxEnemyHp[i]} (-#{@state.damageEnemy[i]})" else "#{@state.afterEnemyHp[i]} / #{@state.maxEnemyHp[i]}"} />
                    </td>
                  else
                    <td>　</td>
                    <td>　</td>
                    <td>　</td>
                </tr>
            }
            </tbody>
          </Table>
        </div>
