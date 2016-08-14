"use strict"

const {React} = window
const Simulator2 = require('../lib/simulator2')
const DetailArea = require('./detail-area')
const OverviewArea = require('./overview-area')


function simulate(battle) {
  try {
    if (!battle) {
      return null
    }

    let simulator = new Simulator2(battle.fleet)
    let stages = []
    for (let packet of battle.packet)
      stages = stages.concat(simulator.simulate(packet))
    return {simulator, stages}

  } catch (error) {
    console.error(error, battle)
    return null
  }
}

class BattleArea extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !(this.props.battle === nextProps.battle)
  }

  render() {
    const {simulator, stages} = simulate(this.props.battle) || {}

    return (
      <div id="battle-area">
        <OverviewArea simulator={simulator} stages={stages} />
        <DetailArea simulator={simulator} stages={stages} />
      </div>
    )
  }
}

export default BattleArea
