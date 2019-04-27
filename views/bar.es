import React from 'react'
import { ProgressBar } from 'react-bootstrap'
import {MaterialIcon, SlotitemIcon} from 'views/components/etc/icon'

const {getStore} = window

export class FABar extends React.Component {
  render() {
    let {max, now, icon} = this.props
    let pcnt = Math.floor(100 * now / max)
    if (! (max && now)) {
      max = now = 0
      pcnt = 100
    }
    return (
      <span className='fa-bar'>
        <MaterialIcon materialId={icon} />
        {`${pcnt}%`}
      </span>
    )
  }
}

export class HPBar extends React.Component {
  getHpStyle(percent) {
    if (percent <= 25)
      return 'danger'
    else if (percent <= 50)
      return 'warning'
    else if (percent <= 75)
      return 'info'
    else
      return 'success'
  }

  render() {
    let {max, from, to, damage, item} = this.props
    if (from < 0) from = 0
    if (from > max) from = max
    if (to < 0) to = 0
    if (to > max) to = max

    let now = 100 * to / max
    let lost = 100 * (from - to) / max
    let additions = []
    if (damage !== 0) {
      additions.push(`${-damage}`)
    }

    const $slotitems = getStore(['const', '$equips']) || {}
    if (item && $slotitems[item]) {
      let itemIcon = $slotitems[item].api_type[3]
      additions.push(<SlotitemIcon slotitemId={itemIcon} />)
    }

    let labels = []
    labels.push(<span key={-1}>{`${to} / ${max}`}</span>)
    if (additions.length > 0) {
      labels.push(<span key={-2}>{' ('}</span>)
      additions.map((addition, i) => {
        labels.push(<span key={i*2+0}>{addition}</span>)
        labels.push(<span key={i*2+1}>{', '}</span>)
      })
      labels.pop()  // Remove last comma
      labels.push(<span key={-3}>{')'}</span>)
    }

    return (
      <ProgressBar className="hp-bar">
        <ProgressBar className="hp-bar" bsStyle={this.getHpStyle(now)} now={now} label={<span>{labels}</span>} />
        <ProgressBar className="hp-bar lost" now={lost} />
      </ProgressBar>
    )
  }
}
