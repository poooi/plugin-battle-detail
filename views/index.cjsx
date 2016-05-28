"use strict"

{remote, React, ReactDOM, ReactBootstrap} = window

AppData = require '../lib/appdata'
PacketManager = require '../lib/packet-manager'
ModalArea = require './modal-area'
OptionArea = require './option-area'
BattleArea = require './battle-area'

# constant
MAX_PACKET_NUMBER = 64

updateNonce = (nonce) ->
  if typeof nonce == "number" and nonce > 0
    return nonce += 1
  else
    return 1

MainArea = React.createClass
  getInitialState: ->
    battle: null
    battleNonce: 0
    battleList: []
    battleListNonce: 0
    shouldAutoShow: true

  componentDidMount: ->
    PacketManager.addListener('packet', @handlePacket)
    ipc.register "BattleDetail",
      showBattleWithTimestamp: @showBattleWithTimestamp

    setTimeout =>
      list = AppData.listPacket()
      return unless list?.length > 0
      packets = []
      for fp in list by -1
        packet = AppData.loadPacketSync fp
        packets.push(packet) if packet?
        break if packets.length >= MAX_PACKET_NUMBER

      # Update state with loaded packets.
      {battleList, battleListNonce, battle, battleNonce} = @state
      battleList = battleList.concat(packets).slice(0, MAX_PACKET_NUMBER)
      @setState
        battle: battleList[0]
        battleNonce: updateNonce battleNonce
        battleList: battleList
        battleListNonce: updateNonce battleListNonce

  componentWillUnmount: ->
    PacketManager.removeListener('packet', @handlePacket)
    ipc.unregisterAll "BattleDetail"

  handlePacket: (newTime, newBattle) ->
    {battle, battleNonce, battleList, battleListNonce, shouldAutoShow} = @state
    if battleList[0]?.time == newTime
      battleList[0] = newBattle
      battleListNonce = updateNonce battleListNonce
    else
      battleList.unshift newBattle
      while battleList.length > MAX_PACKET_NUMBER
        battleList.pop()
      battleListNonce = updateNonce battleListNonce
    if shouldAutoShow
      battle = newBattle
      battleNonce = updateNonce battleNonce
    AppData.savePacket(PacketManager.getId(newBattle), newBattle)
    @setState {battle, battleNonce, battleList, battleListNonce}

  # API for IPC
  showBattleWithTimestamp: (timestamp, callback) ->
    if timestamp?
      start = timestamp - 2000
      end = timestamp + 2000
      list = AppData.searchPacket(start, end)
      if not list?
        message = __ "Unknown error"
      else if list.length == 1
        try
          packet = AppData.loadPacketSync list[0]
          @updateBattle packet
          remote.getCurrentWindow().show()
        catch error
          console.error error
          message __ "Unknown error"
      else if list.length <= 0
        message = __ "Battle not found"
      else if list.length >= 2
        message = __ "Multiple battle found"
    else
      message __ "Unknown error"
    callback?(message)

  # API for Component <OptionArea />
  #   battle=null: using last battle and set `shouldAutoShow` to true.
  updateBattle: (battle) ->
    if battle?
      @setState
        shouldAutoShow: false
        battle: battle
        battleNonce: updateNonce @state.battleNonce
    else
      @setState
        shouldAutoShow: true
        battle: @state.battleList[0]
        battleNonce: updateNonce @state.battleNonce

  render: ->
    <div id="main">
      <ModalArea />
      <OptionArea
        battle={@state.battle}
        battleNonce={@state.battleNonce}
        battleList={@state.battleList}
        battleListNonce={@state.battleListNonce}
        shouldAutoShow={@state.shouldAutoShow}
        updateBattle={@updateBattle}
        />
      <BattleArea
        battle={@state.battle}
        nonce={@state.battleNonce}
        />
    </div>

ReactDOM.render <MainArea />, $('main')
