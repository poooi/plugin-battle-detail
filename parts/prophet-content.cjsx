{Table, ProgressBar, Grid, Input, Col, Alert, Button} = ReactBootstrap
ProphetInfo = require './prophet-info'
ProphetHp = require './prophet-hp'
module.exports = React.createClass
  render: ->
    if @props.isFirst == 1 || (@props.isFirst == 0 && @props.lay == 0)
      if @props.isFirst == 1
        <Table>
          <tbody>
            {
              for j in [0..5]
                if @props.lay == 0
                  if @props.cols == 0 && @props.sortieInfo[j] == -1
                    continue
                  if @props.cols == 1 && @props.sortieInfo[j] == -1 && @props.combinedInfo[j] == -1
                    continue
                if @props.lay == 1
                  if @props.cols == 1 && @props.sortieInfo[j] == -1 && @props.enemyInfo.lv[j] == -1
                    continue
                  if @props.cols == 2 && @props.sortieInfo[j] == -1 && @props.enemyInfo.lv[j] == -1 && @props.combinedInfo[j] == -1
                    continue
                list = []
                for i in [0..(@props.cols)]
                  if (i == @props.cols) && (@props.lay == 1)
                    list.push <ProphetInfo
                      lv={@props.enemyInfo.lv[j]}
                      name={@props.enemyInfo.name[j]}
                      condShow={0}
                      isBack={0}
                      compactMode={@props.compactMode}
                      atk={@props.enemyHp.atk[j]}
                      mvp={if @props.mvpPos[2] == j then true else false}/>
                    list.push <ProphetHp
                      lv={@props.enemyInfo.lv[j]}
                      now={@props.enemyHp.now[j]}
                      max={@props.enemyHp.max[j]}
                      dmg={@props.enemyHp.dmg[j]}
                      isBack={0}/>
                  else if i == 1
                    if @props.combinedInfo[j] != -1
                      tmpLv = window._ships[@props.combinedInfo[j]].api_lv
                      tmpName = window._ships[@props.combinedInfo[j]].api_name
                      tmpCond = window._ships[@props.combinedInfo[j]].api_cond
                    else
                      tmpLv = -1
                      tmpName = -1
                      tmpCond = -1
                    list.push <ProphetInfo
                      lv={tmpLv}
                      name={tmpName}
                      cond={tmpCond}
                      condShow={1}
                      isBack={@props.goBack[j + 6]}
                      compactMode={@props.compactMode}
                      atk={@props.combinedHp.atk[j]}
                      mvp={if @props.mvpPos[1] == j then true else false}/>
                    list.push <ProphetHp
                      lv={tmpLv}
                      now={@props.combinedHp.now[j]}
                      max={@props.combinedHp.max[j]}
                      dmg={@props.combinedHp.dmg[j]}
                      isBack={@props.goBack[j + 6]}/>
                  else if i == 0
                    if @props.sortieInfo[j] != -1
                      tmpLv = window._ships[@props.sortieInfo[j]].api_lv
                      tmpName = window._ships[@props.sortieInfo[j]].api_name
                      tmpCond = window._ships[@props.sortieInfo[j]].api_cond
                    else
                      tmpLv = -1
                      tmpName = -1
                      tmpCond = -1
                    list.push <ProphetInfo
                      lv={tmpLv}
                      name={tmpName}
                      cond={tmpCond}
                      condShow={1}
                      isBack={@props.goBack[j]}
                      compactMode={@props.compactMode}
                      atk={@props.sortieHp.atk[j]}
                      mvp={if @props.mvpPos[0] == j then true else false}/>
                    list.push <ProphetHp
                      lv={tmpLv}
                      now={@props.sortieHp.now[j]}
                      max={@props.sortieHp.max[j]}
                      dmg={@props.sortieHp.dmg[j]}
                      isBack={@props.goBack[j]}/>
                <tr key={j + 1}>
                  {list}
                </tr>
            }
          </tbody>
        </Table>
      else
        <Table>
          <tbody>
            {
              for j in [0..5]
                if @props.enemyInfo.lv[j] == -1
                  continue
                list = []
                for i in [0..0]
                  list.push <ProphetInfo
                    lv={@props.enemyInfo.lv[j]}
                    name={@props.enemyInfo.name[j]}
                    condShow={0}
                    isBack={0}
                    compactMode={@props.compactMode}
                    atk={@props.enemyHp.atk[j]}
                    mvp={if @props.mvpPos[2] == j then true else false}/>
                  list.push <ProphetHp
                    lv={@props.enemyInfo.lv[j]}
                    now={@props.enemyHp.now[j]}
                    max={@props.enemyHp.max[j]}
                    dmg={@props.enemyHp.dmg[j]}
                    isBack={0}/>
                <tr key={j + 6}>
                  {list}
                </tr>
            }
          </tbody>
        </Table>
    else
      <div></div>
