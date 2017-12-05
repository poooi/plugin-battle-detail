import _ from 'lodash'
import { Provider, connect } from 'react-redux'
import { store } from 'views/create-store'
import { modifyObject } from 'subtender'

import ModalArea from './modal-area'
import OptionArea from './option-area'
import OverviewArea from './overview-area'
import DetailArea from './detail-area'
import BrowseArea from './browse-area'
import AppData from 'lib/appdata'
import PacketManager from 'lib/packetmanager'

import { Simulator } from 'lib/battle'
import { PacketCompat, IndexCompat } from 'lib/compat'
import { init as storeInit, actionCreators } from './store'
import { indexesSelector, uiSelector } from './selectors'
import { PTyp } from './ptyp'

const {React, ReactBootstrap, remote, ipc, __} = window

const {Tab, Tabs} = ReactBootstrap

storeInit()

class MainAreaImpl extends React.Component {
  static propTypes = {
    activeTab: PTyp.number.isRequired,
    disableBrowser: PTyp.bool.isRequired,
    battle: PTyp.object,
    indexes: PTyp.array.isRequired,
    showLast: PTyp.bool.isRequired,

    indexesReplace: PTyp.func.isRequired,
    uiModify: PTyp.func.isRequired,
  }

  static defaultProps = {
    battle: null,
  }

  componentDidMount() {
    ipc.register("BattleDetail", {
      showBattleWithTimestamp: this.showBattleWithTimestamp,
    })
    this.pm = new PacketManager()
    this.pm.addListener('battle', this.handlePacket)
    this.pm.addListener('result', this.handlePacket)
  }

  componentWillUnmount() {
    ipc.unregisterAll("BattleDetail")
    this.pm.removeListener('battle', this.handlePacket)
    this.pm.removeListener('result', this.handlePacket)
  }

  handlePacket = async (newBattle, curPacket) => {
    // Save new battle immediately
    const newId = PacketCompat.getId(newBattle)
    AppData.saveBattle(newId, newBattle)

    let {battle, indexes, showLast} = this.state
    if (newId === (indexes[0] || {}).id) {
      indexes.shift()
    }
    indexes = [
      IndexCompat.getIndex(newBattle, newId),
      ...indexes,
    ]
    if (showLast) {
      battle = newBattle
    }
    this.props.uiModify(
      modifyObject('battle', () => battle)
    )
    this.props.indexesReplace(indexes)
    AppData.saveIndex(indexes)
  }

  updateBattle = async (battle) => {
    if (typeof battle === 'number') {
      battle = await AppData.loadBattle(battle)
    }
    this.props.uiModify(_.flow(
      modifyObject('activeTab', () => 0),
      modifyObject('battle', () => battle),
      // TODO: false
      modifyObject('showLast', () => true),
    ))
  }

  updateShowLast = (showLast) =>
    this.props.uiModify(modifyObject('showLast', () => showLast))

  onSelectTab = (key) =>
    this.props.uiModify(modifyObject('activeTab', () => key))

  render() {
    const {battle, activeTab, disableBrowser, indexes} = this.props
    let simulator = {}, stages = []
    try {
      simulator = Simulator.auto(battle, { usePoiAPI: true }) || {}
      stages = simulator.stages || []
    }
    catch (err) {
      console.error(battle, err.stack)
    }

    return (
      <div id="main">
        <ModalArea />
        <Tabs id="main-tabs" activeKey={activeTab} onSelect={this.onSelectTab}>
          <Tab eventKey={0} title={__("Battle")}>
            <OptionArea
              battle={battle}
              updateBattle={this.updateBattle}
            />
            <div id="battle-area">
              <OverviewArea simulator={simulator} stages={stages} />
              <DetailArea simulator={simulator} stages={stages} />
            </div>
          </Tab>
          <Tab eventKey={1} title={__("Browse")} disabled={disableBrowser}>
            <BrowseArea
              indexes={indexes}
              updateBattle={this.updateBattle}
            />
          </Tab>
        </Tabs>
      </div>
    )
  }

  showBattleWithTimestamp = async (timestamp, callback) => {
    let message = null
    do {  // eslint-disable-line no-constant-condition
      if (typeof timestamp != "number") {
        message = __("Unknown error")
        break
      }
      let start = timestamp - 2000
      let end = timestamp + 2000
      let list = []
      const {indexes} = this.props
      for (let {id} of indexes) {
        if (id > end)
          continue
        if (id < start)
          break
        list.push(id)
      }
      if (list == null) {
        message = __("Unknown error")
        break
      }
      if (list.length <= 0) {
        message = __("Battle not found")
        break
      }
      if (list.length >= 2) {
        message = __("Multiple battle found")
        break
      }
      try {
        let id = list[0]
        this.updateBattle(id)
        remote.getCurrentWindow().show()
      } catch (err) {
        message = __("Unknown error")
        console.error(err.stack)
      }
    } while (0)
    if (typeof callback === 'function') {
      callback(message)
    }
  }
}

const MainArea = connect(
  state => {
    const {
      activeTab,
      disableBrowser,
      battle,
      showLast,
    } = uiSelector(state)
    const indexes = indexesSelector(state)
    return {
      activeTab, disableBrowser,
      battle, indexes, showLast,
    }
  },
  actionCreators
)(MainAreaImpl)

const WrappedMain = _props => (
  <Provider store={store}>
    <MainArea />
  </Provider>
)

export default WrappedMain
