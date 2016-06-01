"use strict"

const {React, ReactBootstrap} = window
const {Panel, Grid, Row, Col} = ReactBootstrap
const HpBar = require('./hp-bar')

const DEFAULT_EXPANDED = true
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
    return fleet ? (
      <div className={"fleet-table"}>
        <div className={"fleet-title"}>{title}</div>
        <div>
        {fleet.map((ship, i)=>
          <Col key={i} xs={6}>
            <ShipView ship={ship} />
          </Col>
        )}
        </div>
      </div>
    ) : <div />
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

    return (
      <Grid className="ship-view">
        <Col xs={6}>
          <Row>
            <span>{__r(data.api_name)}</span>
            <span className="position-indicator">{`(${ship.pos})`}</span>
          </Row>
          <Row>{`Lv.${data.api_lv || '?'} Cond.${data.api_cond || '?'}`}</Row>
          <Row><HpBar max={ship.maxHP} from={ship.initHP} to={ship.nowHP} damage={ship.initHP - ship.nowHP} item={null} /></Row>
          <Row>
            <span>{`Fuel ${data.api_fuel || '?'}`}</span>
            <span>  </span>
            <span>{`Ammo ${data.api_bull || '?'}`}</span>
          </Row>
        </Col>
        <Col xs={6}>
        {[].concat(raw.poi_slot, raw.poi_slot_ex).map((item, i) =>
          <ItemView key={i} item={item} />
        )}
        </Col>
      </Grid>
    )
  }
}

class ItemView extends React.Component {
  render() {
    const {item} = this.props
    if (! item) {
      return <div />
    }
    const raw = item
    const mst = $slotitems[item.api_slotitem_id] || {}
    const data = Object.assign(Object.clone(mst), raw)

    return (
      <div>
        <span>{`[${data.api_type[3]}]`}</span>
        <span>{`${data.api_name}`}</span>
        <span>{data.api_alv > 0 ? `A${data.api_alv}` : ''}</span>
        <span>{data.api_level > 0 ? `+${data.api_level}` : ''}</span>
      </div>
    )
  }
}

export default OverviewArea
