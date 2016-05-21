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
    # List of packet saved in APPDATA
    # Use timestamp as id
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

  savePacket: (id, packet) ->
    setTimeout =>
      @savePacketSync(id, packet)

  savePacketSync: (id, packet) ->
    return unless id? and packet?
    file = path.join(APPDATA, "#{id}.json")
    data = JSON.stringify(packet)
    fs.writeFileSync(file, data, FS_RW_OPTIONS)
    @packetList.push(id)

  loadPacket: (id, callback) ->
    return unless id? and callback?
    setTimeout =>
      packet = @loadPacketSync id
      callback(packet)

  loadPacketSync: (id) ->
    return unless id?
    try
      file = path.join(APPDATA, "#{id}.json")
      data = fs.readFileSync(file, FS_RW_OPTIONS)
      packet = JSON.parse(data)
      return packet
    catch error
      console.error error
      return null

  searchPacket: (start, end) ->
    return unless start? and end? and start <= end
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
