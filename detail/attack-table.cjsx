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
    when AttackType.Primary_Primary_CI
      "主砲CI"
    when AttackType.Primary_Torpedo_CI
      "砲雷CI"
    when AttackType.Torpedo_Torpedo_CI
      "魚雷CI"
    else
      "?#{type}?"

HpBar = React.createClass
  render: ->
    percent = 100 * @props.now / @props.max
    if @props.detla and @props.detla > 0
      label = "#{@props.now} / #{@props.max} (-#{@props.detla})"
    else
      label = "#{@props.now} / #{@props.max}"
    <ProgressBar className="hpBar" bsStyle={getHpStyle percent} now={percent} label={label} />

# <DamageInfo damage={damage} isCritical={isCritical} />
DamageInfo = React.createClass
  render: ->
    <span>
    {
      elements = []
      elements.push getAttackTypeName @props.type
      elements.push " "
      elements.push "("
      for damage, i in @props.damage
        elements.push <span style={if @props.isCritical[i] then color: "#FFFF00"}>{damage}</span>
        elements.push ", "
      elements.pop()  # Remove last comma
      elements.push ")"
      elements
    }
    </span>

# AttackInfoRow
AttackInfoRow = React.createClass
  render: ->
    {_ships, $ships} = window
    {type, fromShip, toShip, maxHP, nowHP, damage, isCritical} = @props.attack
    fromShipName = if fromShip? then $ships[fromShip.id]?.api_name else ""
    toShipName = if toShip? then $ships[toShip.id]?.api_name else ""
    totalDamage = damage.reduce ((p, x) -> p + x)
    # Is enemy attack?
    if toShip.owner is ShipOwner.Ours
      <tr>
        <td><HpBar max={maxHP} now={nowHP - totalDamage} detla={totalDamage} /></td>
        <td>{toShipName}</td>
        <td>←</td>
        <td><DamageInfo type={type} damage={damage} isCritical={isCritical} /></td>
        <td></td>
        <td>{fromShipName}</td>
        <td></td>
      </tr>
    else
      <tr>
        <td></td>
        <td>{fromShipName}</td>
        <td></td>
        <td><DamageInfo type={type} damage={damage} isCritical={isCritical} /></td>
        <td>→</td>
        <td>{toShipName}</td>
        <td><HpBar max={maxHP} now={nowHP - totalDamage} detla={totalDamage} /></td>
      </tr>

# AttackTable
module.exports = React.createClass
  render: ->
    <Table striped condensed hover>
      {
        if @props.title
          <caption>{@props.title}</caption>
      }
      <thead>
        <tr>
          <th className='center' style={width: '20%'}>{'HP'}</th>
          <th className='center' style={width: '18%'}>{'Ship Name'}</th>
          <th className='center' style={width: '3%'}>{''}</th>
          <th className='center' style={width: '18%'}>{'Attack Info'}</th>
          <th className='center' style={width: '3%'}>{''}</th>
          <th className='center' style={width: '18%'}>{'Enemy Name'}</th>
          <th className='center' style={width: '20%'}>{'HP'}</th>
        </tr>
      </thead>
      <tbody>
      {
        if @props.attacks
          for attack in @props.attacks
            <AttackInfoRow attack={attack} />
      }
      </tbody>
    </Table>
