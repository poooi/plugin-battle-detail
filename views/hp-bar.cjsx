"use strict"

{React, ReactBootstrap} = window
{ProgressBar} = ReactBootstrap
{SlotitemIcon} = require("#{ROOT}/views/components/etc/icon")

getHpStyle = (percent) ->
  if percent <= 25
    'danger'
  else if percent <= 50
    'warning'
  else if percent <= 75
    'info'
  else
    'success'

HpBar = React.createClass
  render: ->
    {max, from, to, damage, item} = @props
    to = 0 if to < 0
    from = max if from > max
    itemIcon = $slotitems[item]?.api_type[3]

    now = 100 * to / max
    lost = 100 * (from - to) / max
    labels = []
    labels.push <span key={0}>{"#{to} / #{max}"}</span>
    if damage > 0
      labels.push <span key={10}>{" (-#{damage}"}</span>
      if itemIcon?
        labels.push <span key={20}>{", "}</span>
        labels.push <SlotitemIcon slotitemId={itemIcon} />
      labels.push <span key={11}>{")"}</span>
    label = <span>{labels}</span>

    <ProgressBar className="hp-bar">
      <ProgressBar className="hp-bar" bsStyle={getHpStyle now} now={now} label={label} />
      <ProgressBar className="hp-bar lost" now={lost} />
    </ProgressBar>

module.exports = HpBar