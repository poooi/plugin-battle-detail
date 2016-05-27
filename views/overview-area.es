"use strict"

const {React, ReactBootstrap} = window
const {Panel, Grid, Col, Row} = ReactBootstrap
const HpBar = require('./hp-bar')


class ShipTable extends React.Component {
  render() {
    const {ship} = this.props
    if (! (ship && ship.id > 0)) {
      return <div />
    }
    const raw = ship.raw || {}
    const mst = $ships[ship.id] || {}
    const data = Object.assign(Object.clone(mst), raw)

    return (
      <div>{__r(data.api_name)} - Lv {data.api_lv}</div>
    )
  }
}

class OverviewArea extends React.Component {
  constructor() {
    super()
    this.state = {
      isExpanded: false
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
    let fleets = []
    let xs = 12
    if (simulator != null) {
      for (let fleet of [simulator.mainFleet, simulator.escortFleet, simulator.enemyFleet]) {
        if (fleet != null) {
          fleets.push(fleet)
        }
      }
      xs = 12 / fleets.length
    }

    return (
      <div className="overview-area">
        <Panel header={__("Battle Overview")} collapsible defaultExpanded={false}
               onEnter={this.onSelect.bind(this, true)} onExit={this.onSelect.bind(this, false)}>
          <Grid>
            {
              fleets.length > 0 ? (
                fleets.map((fleet, i) =>
                  <Col key={i} xs={xs}>
                    {fleet.map((ship, j) =>
                      <Row key={j}>
                        <ShipTable ship={ship} />
                      </Row>
                    )}
                  </Col>
                )
              ) : __("No battle")
            }
          </Grid>
        </Panel>
      </div>
    )
  }
}

export default OverviewArea
