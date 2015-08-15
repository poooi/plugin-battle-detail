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
                  if @props.cols == 1 && @props.sortieInfo[j] == -1 && @props.enemyInfo[j] == -1
                    continue
                  if @props.cols == 2 && @props.sortieInfo[j] == -1 && @props.enemyInfo[j] == -1 && @props.combinedInfo[j] == -1
                    continue
                list = []
                for i in [0..(@props.cols)]
                  if i == 2
                    list.push <ProphetInfo
                      lv={@props.enemyInfo[j]}
                      name={@props.enemyInfo[j + 6]}
                      cond={@props.enemyInfo[j + 12]}
                      condShow={0} />
                    list.push <ProphetHp
                      now={@props.enemyHp[j]}
                      max={@props.enemyHp[j + 6]}
                      dmg={@props.enemyHp[j + 12]} />
                  else if i == 1
                    list.push <ProphetInfo
                      lv={@props.combinedInfo[j]}
                      name={@props.combinedInfo[j + 6]}
                      cond={@props.combinedInfo[j + 12]}
                      condShow={0} />
                    list.push <ProphetHp
                      now={@props.combinedHp[j]}
                      max={@props.combinedHp[j + 6]}
                      dmg={@props.combinedHp[j + 12]} />
                  else if i == 0
                    list.push <ProphetInfo
                      lv={@props.sortieInfo[j]}
                      name={@props.sortieInfo[j + 6]}
                      cond={@props.sortieInfo[j + 12]}
                      condShow={@props.prophetCondShow && (@props.cols - @props.lay) == 0} />
                    list.push <ProphetHp
                      now={@props.sortieHp[j]}
                      max={@props.sortieHp[j + 6]}
                      dmg={@props.sortieHp[j + 12]} />
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
                if @props.enemyInfo[j] == -1
                  continue
                list = []
                for i in [0..0]
                  list.push <ProphetInfo
                    lv={@props.enemyInfo[j]}
                    name={@props.enemyInfo[j + 6]}
                    cond={@props.enemyInfo[j + 12]}
                    condShow={0} />
                  list.push <ProphetHp
                    now={@props.enemyHp[j]}
                    max={@props.enemyHp[j + 6]}
                    dmg={@props.enemyHp[j + 12]} />
                <tr key={j + 6}>
                  {list}
                </tr>
            }
          </tbody>
        </Table>
    else
      <div>""</div>
