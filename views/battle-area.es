
const DetailArea = require('./detail-area')
import OverviewArea from './overview-area'
import { Simulator } from 'lib/battle'
const {React} = window

function simulate(battle) {
  try {
    return Simulator.auto(battle, {usePoiAPI: true})
  } catch (error) {
    console.error(battle, error.stack)
  }
  return new Object()
}

class BattleArea extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !(this.props.battle === nextProps.battle)
  }

  render() {
    const simulator = simulate(this.props.battle)
    const {stages} = simulator

    return (
      <div id="battle-area">
        <OverviewArea simulator={simulator} stages={stages} />
        <DetailArea simulator={simulator} stages={stages} />
      </div>
    )
  }
}

export default BattleArea
