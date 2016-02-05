"use strict"

fs = require 'fs-extra'
glob = require 'glob'
path = require 'path-extra'

# constant
window.APPDATA = path.join(window.APPDATA_PATH, 'battle-detail')
REFRESH_INTERVAL = 60000
FS_RW_OPTIONS =
  encoding: 'UTF-8'

# init
fs.ensureDir APPDATA, (error) ->
  return if !error
  console.error(error)


class AppData
  constructor: ->
    # timestamp list of packet saved in APPDATA
    # from oldest to newest
    @packetList = []
    @packetListLastRefresh = 0

  # Packet Management
  listPacket: ->
    if @packetList.length <= 0
      @_refreshPacketSync()
    else
      @_refreshPacket()
    return @packetList

  savePacket: (packet) ->
    setTimeout =>
      @savePacketSync(packet)

  savePacketSync: (packet) ->
    return unless packet? and packet.poi_timestamp?
    timestamp = packet.poi_timestamp
    file = path.join(APPDATA, "#{timestamp}.json")
    data = JSON.stringify(packet)
    fs.writeFileSync(file, data, FS_RW_OPTIONS)
    @packetList.push(timestamp)

  loadPacket: (timestamp, callback) ->
    setTimeout =>
      return unless timestamp? and callback?
      packet = @loadPacketSync timestamp
      callback(packet)

  loadPacketSync: (timestamp) ->
    try
      return unless timestamp?
      file = path.join(APPDATA, "#{timestamp}.json")
      data = fs.readFileSync(file, FS_RW_OPTIONS)
      packet = JSON.parse(data)
      return packet
    catch error
      console.error error
      return null

  searchPacket: (start, end) ->
    return unless start? and end?
    return unless start <= end
    @_refreshPacket()
    list = []
    for timestamp, i in @packetList
      continue if timestamp < start
      break    if timestamp > end
      list.push timestamp
    return list

  _refreshPacket: ->
    setTimeout =>
      @_refreshPacketSync()

  _refreshPacketSync: ->
    return unless (Date.now() - @packetListLastRefresh) > REFRESH_INTERVAL
    # list = fs.readdirSync APPDATA
    list = glob.sync path.join(APPDATA, "*.json")
    list = list.map (p) -> parseInt path.parse(p).name
    list.sort()
    @packetListLastRefresh = Date.now()
    @packetList = list


module.exports = new AppData()
