{Table, ProgressBar, Grid, Input, Col, Alert, Button} = ReactBootstrap
{Ship, ShipOwner, Attack, AttackType, Stage, StageType} = require '../lib/common'

getHpStyle = (percent) ->
  if percent <= 25
    'danger'
  else if percent <= 50
    'warning'
  else if percent <= 75
    'info'
  else
    'success'

getAttackTypeName = (type) ->
  switch type
    when AttackType.Normal
      "通常"
    when AttackType.Double
      "連撃"
    when AttackType.Primary_Secondary_CI
      "主副CI"
    when AttackType.Primary_Radar_CI
      "主電CI"
    when AttackType.Primary_AP_CI
      "主徹CI"
    when AttackType.Primary_Torpedo_CI
      "砲雷CI"
    when AttackType.Torpedo_Torpedo_CI
      "魚雷CI"

HpBar = React.createClass
  render: ->
    percent = 100 * @props.now / @props.max
    <ProgressBar bsStyle={getHpStyle percent} now={percent} />

# <DamageInfo damage={damage} isCritical={isCritical} />
DamageInfo = React.createClass
  render: ->
    <span>
    {
      elements = []
      for damage, i in @props.damage
        elements.push <a style={if @props.isCritical[i] then color: "#FFFF00"}>{damage}</a>
        elements.push ", "
      elements.pop()  # Remove last comma
      elements
    }
    </span>

# AttackInfoRow
AttackInfoRow = React.createClass
  render: ->
    {_ships, $ships} = window
    {type, fromShip, toShip, maxHP, nowHP, damage, isCritical} = @props.attack
    # Is enemy attack?
    if fromShip.owner is ShipOwner.Enemy
      <tr>
        <td><HpBar max={maxHP} now={damage.reduce ((p, x) -> p - x), nowHP} /></td>
        <td>{$ships[toShip.id].api_name}</td>
        <td>← {getAttackTypeName type} <DamageInfo damage={damage} isCritical={isCritical} /></td>
        <td>{$ships[fromShip.id].api_name}</td>
        <td></td>
      </tr>
    else
      <tr>
        <td></td>
        <td>{$ships[fromShip.id].api_name}</td>
        <td>{getAttackTypeName type} <DamageInfo damage={damage} isCritical={isCritical} /> →</td>
        <td>{$ships[toShip.id].api_name}</td>
        <td><HpBar max={maxHP} now={damage.reduce ((p, x) -> p - x), nowHP} /></td>
      </tr>

# AttackTable
module.exports = React.createClass
  render: ->
    <Table striped condensed hover>
      <thead>
        <tr>
          <th className='center'>{'HP'}</th>
          <th className='center'>{'Ship Name'}</th>
          <th className='center'>{'Attack Info'}</th>
          <th className='center'>{'Enemy Name'}</th>
          <th className='center'>{'HP'}</th>
        </tr>
      </thead>
      <tbody>
      {
        for attack, i in @props.attacks
          <AttackInfoRow attack={attack} />
      }
      </tbody>
    </Table>
