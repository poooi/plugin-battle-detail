"use strict"

const {React} = window
const PacketManager = require('../lib/packet-manager')
const Simulator2 = require('../lib/simulator2')
const DetailArea = require('./detail-area')
const OverviewArea = require('./overview-area')


function simulate(battle) {
  try {
    if (!battle) {
      return null
    }

    // Keep compatibility for version 1.0
    if (battle.version === undefined) {
      battle = PacketManager.convertV1toV2(battle)
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
    return !(this.props.nonce === nextProps.nonce)
  }

  render() {
    const {simulator, stages} = simulate(this.props.battle) || {}

    return (
      <div className="battle-area">
        <OverviewArea simulator={simulator} stages={stages} />
        <DetailArea simulator={simulator} stages={stages} />
      </div>
    )
  }
}

export default BattleArea
