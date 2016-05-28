"use strict"

const {React, ReactBootstrap} = window
const {Panel, Grid, Row, Col} = ReactBootstrap
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
      <div className="ship-table">
        <div className="ship-info">
          <span>{__r(data.api_name)}</span>
          <span><HpBar max={ship.maxHP} from={ship.nowHP} to={ship.nowHP} damage={null} item={null} /></span>
        </div>
      </div>
    )
  }
}

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
      <div id="overview-area">
        <Panel header={__("Battle Overview")} collapsible defaultExpanded={DEFAULT_EXPANDED}
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
