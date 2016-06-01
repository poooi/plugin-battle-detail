"use strict"

const {React, ReactBootstrap} = window
const {ProgressBar} = ReactBootstrap

export class FABar extends React.Component {
  render() {
    let {max, now, icon} = this.props
    let pcnt = Math.round(100 * now / max)
    if (! (max && now)) {
      max = now = 0
      pcnt = 100
    }
    return (
      // <ProgressBar className="fa-bar" style={{'background-color': 'rgba(0,0,0,1)'}} now={pcnt} label={`${now}/${max} (${pcnt}%)`} />
      <span className='fa-bar'>
        <img src={`file://${ROOT}/assets/img/material/0${icon}.png`} />
        {`${pcnt}%`}
      </span>
    )
  }
}
