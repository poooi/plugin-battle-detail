"use strict"

const {React, ReactBootstrap} = window
const {Panel, Grid, Row, Col, ProgressBar} = ReactBootstrap
const {SlotitemIcon} = require(`${ROOT}/views/components/etc/icon`)
const {FABar, HPBar} = require('./bar')

const DEFAULT_EXPANDED = false
class OverviewArea extends React.Component {
  constructor() {
    super()
    this.state = {
      isExpanded: DEFAULT_EXPANDED
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.isExpanded
  }

  onSelect(b) {
    this.setState({
      isExpanded: b,
    })
  }

  render() {
    const {simulator} = this.props
    return (
      <div id="overview-area">
        <Panel header={__("Battle Overview")} collapsible defaultExpanded={DEFAULT_EXPANDED}
               onEnter={this.onSelect.bind(this, true)} onExit={this.onSelect.bind(this, false)}>
        {
          simulator ? (
            <div>
              <FleetView fleet={simulator.mainFleet} title={__('Main Fleet')} />
              <FleetView fleet={simulator.escortFleet} title={__('Escort Fleet')} />
              <FleetView fleet={simulator.supportFleet} title={__('Support Fleet')} />
              <FleetView fleet={simulator.enemyFleet} title={__('Enemy Fleet')} />
            </div>
          ) : __("No battle")
        }
        </Panel>
      </div>
    )
  }
}

class FleetView extends React.Component {
  render() {
    const {fleet, title} = this.props
    if (! fleet) {
      return <div />
    }
    let rows = []
    for (let i of Array(Math.ceil(fleet.length / 2)).keys()) {
      rows.push([fleet[2*i+0], fleet[2*i+1]])
    }
    return (
      <div className="fleet-view">
        <div className="fleet-title">{title}</div>
        <Grid>
        {rows.map(([a, b], i) =>
          <Row key={i}>
            <Col xs={6}>
              <ShipView ship={a} />
            </Col>
            <Col xs={6}>
              <ShipView ship={b} />
            </Col>
          </Row>
        )}
        </Grid>
      </div>
    )
  }
}

class ShipView extends React.Component {
  render() {
    const {ship} = this.props
    if (! (ship && ship.id > 0)) {
      return <div />
    }
    const raw = ship.raw || {}
    const mst = $ships[ship.id] || {}
    const data = Object.assign(Object.clone(mst), raw)

    if (! data.api_maxeq) {
      data.api_maxeq = [0, 0, 0, 0, 0]
    }
    if (! data.api_onslot) {
      data.api_onslot = data.api_maxeq
    }

    return (
      <Grid className="ship-view">
        <Col xs={5}>
          <Row className='ship-name'>
            <span>{__r(data.api_name)}</span>
            <span className="position-indicator">{`(${ship.pos})`}</span>
          </Row>
          <Row className='ship-info'>
            <Col xs={6}>{`Lv.${data.api_lv || '-'}`}</Col>
            <Col xs={6}>{`Cond.${data.api_cond || '-'}`}</Col>
          </Row>
          <Row className='ship-fa'>
            <Col xs={6}><FABar icon={1} max={data.api_fuel_max} now={data.api_fuel} /></Col>
            <Col xs={6}><FABar icon={2} max={data.api_bull_max} now={data.api_bull} /></Col>
          </Row>
          <Row className='ship-hp'><HPBar max={ship.maxHP} from={ship.initHP} to={ship.nowHP} damage={ship.lostHP} item={ship.useItem} /></Row>
        </Col>
        <Col xs={7}>
        {[].concat(data.poi_slot, data.poi_slot_ex).map((item, i) =>
          <ItemView key={i} item={item} num={data.api_onslot[i] || '+'}
            warn={data.api_onslot[i] !== data.api_maxeq[i]} />
        )}
        </Col>
      </Grid>
    )
  }
}

class ItemView extends React.Component {
  render() {
    const {item, num, warn} = this.props
    if (! item) {
      return <div />
    }
    const raw = item
    const mst = $slotitems[item.api_slotitem_id] || {}
    const data = Object.assign(Object.clone(mst), raw)

//            <span className={`number ${warn ? 'text-warning' : ''}`}>{num}</span>
    return (
      <Row className='item-view'>
        <div className='item-info'>
          <span className='item-icon'>
            <SlotitemIcon slotitemId={data.api_type[3]} />
          </span>
          <span className='item-name'>
            {`${__r(data.api_name)}`}
          </span>
        </div>
        <div className='item-attr'>
          <span className="alv">{data.api_alv > 0 ? <img src={`file://${ROOT}/assets/img/airplane/alv${data.api_alv}.png`} /> : ''}</span>
          <span className="level">{data.api_level > 0 ? `★${data.api_level}` : ''}</span>
        </div>
      </Row>
    )
  }
}

export default OverviewArea
