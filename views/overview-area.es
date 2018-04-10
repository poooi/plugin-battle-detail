import _ from 'lodash'
import React from 'react'
import { Panel, Grid, Row, Col } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'

import {getShipName, getItemName} from 'views/utils'
import { equipIsAircraft } from 'views/utils/game-utils'
import { SlotitemIcon } from 'views/components/etc/icon'

import {FABar, HPBar} from './bar'

const {ROOT, __, getStore} = window

const DEFAULT_EXPANDED = false
class OverviewArea extends React.PureComponent {
  render() {
    const {simulator} = this.props
    return (
      <div id="overview-area">
        <Panel
          collapsible defaultExpanded={DEFAULT_EXPANDED}
        >
          <Panel.Heading>
            <Panel.Title toggle>
              <span>{__("Battle Overview")} <FontAwesome name='caret-down' /></span>
            </Panel.Title>
          </Panel.Heading>
          <Panel.Collapse>
            <Panel.Body>
              {
                simulator ? (
                  <div>
                    <FleetView fleet={simulator.mainFleet} title={__('Main Fleet')} />
                    <FleetView fleet={simulator.escortFleet} title={__('Escort Fleet')} />
                    <FleetView fleet={simulator.supportFleet} title={__('Support Fleet')} />
                    <FleetView fleet={simulator.landBaseAirCorps} title={__('Land Base Air Corps')} View={LBACView} />
                    <FleetView fleet={simulator.friendFleet} title={__('Friendly Fleet')} />
                    <FleetView fleet={simulator.enemyFleet} title={__('Enemy Fleet')} />
                    <FleetView fleet={simulator.enemyEscort} title={__('Enemy Escort Fleet')} />
                  </div>
                ) : __("No battle")
              }
            </Panel.Body>
          </Panel.Collapse>
        </Panel>
      </div>
    )
  }
}

class FleetView extends React.Component {
  render() {
    let {fleet, title, View} = this.props
    if (! (fleet && fleet.length > 0)) {
      return <div />
    }
    if (View == null) {
      View = ShipView
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
                <View child={a} />
              </Col>
              <Col xs={6}>
                <View child={b} />
              </Col>
            </Row>
          )}
        </Grid>
      </div>
    )
  }
}

class ShipView extends React.Component {
  getCondClass(cond) {
    if (cond == null) {
      return ''
    } else if (cond >= 50) {
      return 'poi-ship-cond-50'
    } else if (cond >= 30) {
      return 'poi-ship-cond-30'
    } else if (cond >= 20) {
      return 'poi-ship-cond-20'
    } else {
      return 'poi-ship-cond-0'
    }
  }

  render() {
    let {child: ship} = this.props
    if (! (ship && ship.id > 0)) {
      return <div />
    }
    let raw = ship.raw || {}
    let mst = getStore(['const', '$ships', ship.id]) || {}
    let data = Object.assign(Object.clone(mst), raw)

    if (! data.api_maxeq) {
      data.api_maxeq = []
    }
    if (! data.api_onslot) {
      data.api_onslot = data.api_maxeq
    }

    return (
      <Grid className="ship-view">
        <Col xs={5}>
          <Row className='ship-name'>
            <span>{getShipName(data)}</span>
            <span className="position-indicator">{`(${ship.id})`}</span>
          </Row>
          <Row className='ship-info'>
            <Col xs={6}>
              <span>Lv.</span>
              <span>{data.api_lv || '-'}</span>
            </Col>
            <Col xs={6}>
              <span>Cond.</span>
              <span className={this.getCondClass(data.api_cond)}>
                {_.isInteger(data.api_cond) ? data.api_cond : '-'}
              </span>
            </Col>
          </Row>
          <Row className='ship-fa'>
            <Col xs={6}><FABar icon={1} max={data.api_fuel_max} now={data.api_fuel} /></Col>
            <Col xs={6}><FABar icon={2} max={data.api_bull_max} now={data.api_bull} /></Col>
          </Row>
          <Row className='ship-hp'>
            <HPBar max={ship.maxHP} from={ship.initHP} to={ship.nowHP} damage={ship.lostHP} item={ship.useItem} />
          </Row>
        </Col>
        <Col xs={7}>
          {(data.poi_slot || []).map((item, i) =>
            <ItemView key={i} item={item} extra={false} label={data.api_onslot[i]}
              warn={data.api_onslot[i] !== data.api_maxeq[i]} />
          )}
          <ItemView item={data.poi_slot_ex} extra={true} label={'+'} warn={false} />
        </Col>
      </Grid>
    )
  }
}

class LBACView extends React.Component {
  render() {
    let {child: corps} = this.props
    if (! (corps && corps.api_plane_info)) {
      return <div />
    }
    return (
      <Grid className="lbac-view">
        <Col xs={5}>
          <Row className='lbac-name'>
            <span>{getItemName(corps)}</span>
            <span className="position-indicator">{`(No.${corps.api_rid})`}</span>
          </Row>
        </Col>
        <Col xs={7}>
          {corps.api_plane_info.map((plane, i) =>
            <ItemView key={i} item={plane.poi_slot} extra={false} label={plane.api_count}
              warn={plane.api_count !== plane.api_max_count} />
          )}
        </Col>
      </Grid>
    )
  }
}

class ItemView extends React.Component {
  render() {
    let {item, extra, label, warn} = this.props
    if (! item) {
      return <div />
    }
    let raw = item
    let mst = getStore(['const', '$equips', item.api_slotitem_id]) || {}
    let data = Object.assign(Object.clone(mst), raw)

    return (
      <Row className='item-view'>
        <div className='item-info'>
          <span className='item-icon'>
            <SlotitemIcon slotitemId={data.api_type[3]} />
            {(label != null && (extra || equipIsAircraft(data.api_type[3]))) ? (
              <span className={`number ${warn ? 'text-warning' : ''}`}>{label}</span>
            ) : null}
          </span>
          <span className='item-name'>
            {`${getShipName(data)}`}
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
