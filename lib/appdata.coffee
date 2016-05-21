"use strict"

fs = require 'fs-extra'
glob = require 'glob'
path = require 'path-extra'
zlib = require 'zlib'

# constant
window.APPDATA = path.join(window.APPDATA_PATH, 'battle-detail')
REFRESH_INTERVAL = 60000

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
    @packetFile = {}
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
    try
      name = "#{id}.json.gz"
      fpath = path.join(APPDATA, name)
      data = zlib.gzipSync(JSON.stringify(packet))
      fs.writeFileSync(fpath, data)

      @packetList.push(id)
      @packetFile[id] =
        name: name
        packet: packet
    catch error
      console.error error

  loadPacket: (id, callback) ->
    return unless id? and callback?
    setTimeout =>
      packet = @loadPacketSync id
      callback(packet)

  loadPacketSync: (id) ->
    return unless id?
    try
      file = @packetFile[id]
      return null if not file?
      return file.packet if file.packet?

      fpath = path.join(APPDATA, file.name)
      data = fs.readFileSync(fpath)
      if path.parse(file.name).ext == '.gz'
        data = zlib.unzipSync(data).toString()

      packet = JSON.parse(data)
      file.packet = packet
      return packet
    catch error
      console.error error

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
    list = []
    list = list.concat(glob.sync(path.join(APPDATA, "*.json")))
    list = list.concat(glob.sync(path.join(APPDATA, "*.json.gz")))
    list = list.map (p) =>
      pp = path.parse(p)
      name = pp.base
      id = parseInt(name.slice(0, name.indexOf('.')))
      @packetFile[id] ?=
        name: name
        packet: null
      return id
    list.sort()
    @packetListLastRefresh = Date.now()
    @packetList = list


module.exports = new AppData()
