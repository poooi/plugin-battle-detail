{remote} = window
fs = require 'fs'
glob = require 'glob'
path = require 'path-extra'
try ipc = remote.require './lib/ipc'
catch error then console.log error

{React, ReactDOM, ReactBootstrap} = window
ModalArea = require './modal-area'
OptionArea = require './option-area'
BattleInfoArea = require './battle-info-area'
BattleDetailArea = require './battle-detail-area'

# constant
MAX_PACKET_NUMBER = 64
APPDATA = path.join(window.APPDATA_PATH, 'battle-detail');
fs.mkdir APPDATA, (error) ->
  return if !error
  return if error.code == 'EEXIST'
  console.error(error)
FS_RW_OPTIONS =
  encoding: 'UTF-8'

updateNonce = (nonce) ->
  if typeof nonce == "number" and nonce > 0
    return nonce += 1
  else
    return 1

updatePacketWithFleetInfo = (packet, isCombined, isCarrier, sortieFleetID, combinedFleetID) ->
  return unless packet?
  # Obtain fleet information. (Ship id and ship equipment.)
  # Empty slot is `null`.
  {_ships, _slotitems, _decks} = window
  obtainFleetInfo = (id, fleet, equipment) ->
    return unless typeof id == "number" and id >= 0
    for ship_id, i in _decks[id].api_ship
      fleet[i] = null
      continue unless ship = _ships[ship_id]
      fleet[i] = ship.api_ship_id
      equipment[i] = []
      for equip_id, j in ship.api_slot
        equipment[i][j] = null
        continue unless equip = _slotitems[equip_id]
        equipment[i][j] = equip.api_slotitem_id
      equipment[i].push if ship.api_slot_ex > 0 then ship.api_slot_ex else null
    return
  sortieFleet = []
  sortieEquipment = []
  combinedFleet = []
  combinedEquipment = []
  obtainFleetInfo sortieFleetID, sortieFleet, sortieEquipment
  obtainFleetInfo combinedFleetID, combinedFleet, combinedEquipment

  packet.poi_is_combined = isCombined   # 連合艦隊？
  packet.poi_is_carrier = isCarrier     # 空母機動部隊=true, 水上打撃部隊=false
  packet.poi_sortie_fleet = sortieFleet
  packet.poi_sortie_equipment = sortieEquipment
  packet.poi_combined_fleet = combinedFleet
  packet.poi_combined_equipment = combinedEquipment

updatePacketWithMetadata = (packet, path, timestamp, comment) ->
  return unless packet?
  packet.poi_uri = path
  packet.poi_timestamp = timestamp
  packet.poi_comment = comment

savePacket = (packet) ->
  setTimeout ->
    return unless packet? and packet.poi_timestamp?
    filename = packet.poi_timestamp
    file = path.join(APPDATA, "#{filename}.json")
    data = JSON.stringify(packet)
    fs.writeFileSync(file, data, FS_RW_OPTIONS)

# filename = "#{packet.poi_timestamp}.json"
loadPacket = (filename, callback) ->
  setTimeout ->
    return unless filename? and callback?
    file = path.join(APPDATA, filename)
    data = fs.readFileSync(file, FS_RW_OPTIONS)
    packet = JSON.parse(data)
    callback(packet)

loadPacketSync = (path) ->
  try
    return unless path?
    data = fs.readFileSync(path, FS_RW_OPTIONS)
    packet = JSON.parse(data)
  catch error
    console.error error


MainArea = React.createClass
  getInitialState: ->
    # Game states
    isCombined: false
    isCarrier: false
    battleComment: ""
    # Battle Packets Management
    packetList: []
    packetListNonce: 0
    battlePacket: null
    battleNonce: 0
    shouldAutoShow: true

  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
    try
      ipc.register "BattleDetail",
        showBattleWithTimestamp: @showBattleWithTimestamp
    catch error then console.log error

    setTimeout =>
      # Read packets from disk.
      list = glob.sync(path.join(APPDATA, "*.json"))
      list.sort (a, b) ->     # Sort from newest to older
        parseInt(path.parse(b).name) - parseInt(path.parse(a).name)
      packets = []
      for fp in list
        packet = loadPacketSync fp
        packets.push(packet) if packet?
        break if packets.length >= MAX_PACKET_NUMBER

      # Update state with loaded packets.
      {packetList, packetListNonce, battlePacket, battleNonce} = @state
      packetList = packetList.concat(packets).slice(0, MAX_PACKET_NUMBER)
      @setState
        packetList: packetList
        packetListNonce: updateNonce packetListNonce
        battlePacket: packetList[0]
        battleNonce: updateNonce battleNonce

  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
    try
      ipc.unregisterAll "BattleDetail"
    catch error then console.log error

  handleResponse: (e) ->
    `var path;`   # HACK: Force shadowing an variable `path`;
    {method, path, body, postBody} = e.detail
    {isCombined, isCarrier, battleComment, packetList, packetListNonce, battleNonce, battlePacket} = @state
    isStateChanged = false

    # Combined Fleet Status
    switch path
      when '/kcsapi/api_port/port'
        switch body.api_combined_flag
          when 1, 3  # 1=空母機動部隊, 3=輸送護衛部隊
            isStateChanged = true
            isCombined = true
            isCarrier = true
          when 2  # 2=水上打撃部隊
            isStateChanged = true
            isCombined = true
            isCarrier = false
          else
            isStateChanged = true
            isCombined = false
            isCarrier = false
      # Oh fuck. Someone sorties with No.3/4 fleet when having combined fleet.
      when '/kcsapi/api_req_map/start'
        if isCombined and parseInt(postBody.api_deck_id) != 1
          isStateChanged = true
          isCombined = false
          isCarrier = false

    # Battle Comment
    switch path
      when '/kcsapi/api_req_map/start', '/kcsapi/api_req_map/next'
        isStateChanged = true
        sortie = __ "Sortie"
        mapArea = body.api_maparea_id
        mapCell = body.api_mapinfo_no
        mapSpot = body.api_no
        if body.api_event_id == 5   # 5=ボス戦闘
          mapSpot += ", boss"
        battleComment = "#{sortie} #{mapArea}-#{mapCell} (#{mapSpot})"
      when '/kcsapi/api_req_member/get_practice_enemyinfo'
        isStateChanged = true
        practice = __ "Pratice"
        name = body.api_nickname
        level = body.api_level
        battleComment = "#{practice} #{name} (Lv.#{level})"

    # Battle Packets Management
    isBattle = false
    switch path
      # Normal fleet
      when '/kcsapi/api_req_sortie/battle', '/kcsapi/api_req_practice/battle', '/kcsapi/api_req_sortie/airbattle'
        isBattle = true
        isCombined = false
        sortieID = body.api_dock_id - 1
        combinedID = null
      when '/kcsapi/api_req_battle_midnight/battle', '/kcsapi/api_req_practice/midnight_battle'
        if packetList[0]?.api_midnight_flag
          oldBody = packetList.shift()
          oldBody.api_hougeki = body.api_hougeki
          body = oldBody
          # Dont update packet metadata
          path = body.poi_uri
          timestamp = body.poi_timestamp
          battleComment = body.poi_comment
        isBattle = true
        isCombined = false
        sortieID = if body.api_dock_id? then body.api_dock_id - 1 else body.api_deck_id - 1
        combinedID = null
      when '/kcsapi/api_req_battle_midnight/sp_midnight'
        isBattle = true
        isCombined = false
        sortieID = body.api_deck_id - 1
        combinedID = null
      # Carrier Task Force
      when '/kcsapi/api_req_combined_battle/battle'
        isBattle = true
        isCombined = true
        isCarrier = true
        sortieID = body.api_deck_id - 1
        combinedID = 1
      # Surface Task Force
      when '/kcsapi/api_req_combined_battle/battle_water'
        isBattle = true
        isCombined = true
        isCarrier = false
        sortieID = body.api_deck_id - 1
        combinedID = 1
      # Combined fleet shared api
      when '/kcsapi/api_req_combined_battle/airbattle'
        isBattle = true
        isCombined = true
        isCarrier = isCarrier
        sortieID = body.api_deck_id - 1
        combinedID = 1
      when '/kcsapi/api_req_combined_battle/midnight_battle'
        if packetList[0]?.api_midnight_flag
          oldBody = packetList.shift()
          oldBody.api_hougeki = body.api_hougeki
          body = oldBody
          # Dont update packet metadata
          path = body.poi_uri
          timestamp = body.poi_timestamp
          battleComment = body.poi_comment
        isBattle = true
        isCombined = true
        isCarrier = isCarrier
        sortieID = body.api_deck_id - 1
        combinedID = 1
      when '/kcsapi/api_req_combined_battle/sp_midnight'
        isBattle = true
        isCombined = true
        isCarrier = isCarrier
        sortieID = body.api_deck_id - 1
        combinedID = 1

    if isBattle
      isStateChanged = true
      timestamp = Date.now()
      updatePacketWithFleetInfo body, isCombined, isCarrier, sortieID, combinedID
      updatePacketWithMetadata body, path, timestamp, battleComment
      packetList.unshift body
      packetListNonce = updateNonce packetListNonce
      while packetList.length > MAX_PACKET_NUMBER
        packetList.pop()
      # Save packet
      savePacket body
      # Render battle packet
      if @shouldAutoShow
        battleNonce = updateNonce battleNonce
        battlePacket = body

    # Update State
    if isStateChanged
      @setState
        isCombined: isCombined
        isCarrier: isCarrier
        battleComment: battleComment
        packetList: packetList
        packetListNonce: packetListNonce
        battleNonce: battleNonce
        battlePacket: battlePacket

  # API for IPC
  showBattleWithTimestamp: (timestamp, callback) ->
    range = [timestamp - 2000, timestamp + 2000]
    list = glob.sync(path.join(APPDATA, "{#{range[0]}..#{range[1]}}.json"))
    if list.length == 1
      try
        packet = loadPacketSync list[0]
        @updateBattlePacket packet
        remote.getCurrentWindow().focus()
      catch error
        message __ "Unknown error"
        console.error error
    if list.length <= 0
      message = __ "Packet not found."
    if list.length >= 2
      message = __ "Multiple packets found."
    callback(message)

  # API for Component <OptionArea />
  #   packet=null: using last battle and set `shouldAutoShow` to true.
  updateBattlePacket: (packet) ->
    if packet?
      @setState
        shouldAutoShow: false
        battlePacket: packet
        battleNonce: updateNonce @state.battleNonce
    else
      @setState
        shouldAutoShow: true
        battlePacket: @state.packetList[0]
        battleNonce: updateNonce @state.battleNonce

  render: ->
    <div className="main">
      <ModalArea />
      <OptionArea
        packetList={@state.packetList}
        packetListNonce={@state.packetListNonce}
        battlePacket={@state.battlePacket}
        battleNonce={@state.battleNonce}
        shouldAutoShow={@state.shouldAutoShow}
        updateBattlePacket={@updateBattlePacket}
        />
      <BattleInfoArea
        battleNonce={@state.battleNonce}
        battlePacket={@state.battlePacket}
        />
      <BattleDetailArea
        battleNonce={@state.battleNonce}
        battlePacket={@state.battlePacket}
        />
    </div>

ReactDOM.render <MainArea />, $('main')
