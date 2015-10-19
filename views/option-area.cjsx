{React, ReactBootstrap} = window
{Panel, Grid, Row, Col, Button, Input, Modal} = ReactBootstrap
clipboard = require 'clipboard'


OptionArea = React.createClass
  getInitialState: ->
    # selectedPacket can be 3 type
    #   null : Last battle packet
    #   packet in @props.battlePackets
    #   packet not in @props.battlePackets (imported)
    selectedPacket: null
  shouldComponentUpdate: (nextProps, nextState) ->
    return true if @state.selectedPacket?.poi_timestamp != nextState.selectedPacket?.poi_timestamp
    return false if @props.battlePacketsNonce == nextProps.battlePacketsNonce
    return true

  handleSelectPacket: ->
    index = parseInt(@refs.selectedIndex.getValue())
    return if index is NaN
    # Use 'default' when selected packet out of range
    if index < 0
      packet = @props.battlePackets[0]
      @props.toggleAutoShow true
      @setState
        selectedPacket: null
      @props.updateBattleDetail packet
    else
      packet = @props.battlePackets[index]
      @props.toggleAutoShow false
      @setState
        selectedPacket: packet
      @props.updateBattleDetail packet

  handleClickExport: ->
    isSuccessful = true
    try
      packet = @state.selectedPacket
      packet = JSON.stringify packet
      clipboard.writeText(packet)
    catch e
      isSuccessful = false

    if isSuccessful
      window.showModal
        title: __ "Copy Data"
        body: [<p>{__ "The battle packet was copied to clipboard."}</p>,
               <p>{__ "You can send your friends the packet to share the battle."}</p>]
        footer: null
    else
      window.showModal
        title: __ "Copy Data"
        body: [<p>{__ "Failed to copy battle packet to clipboard!"}</p>]
        footer: null

  handleClickImport: ->
    try
      packet = clipboard.readText(packet)
      packet = JSON.parse packet
      @props.updateBattleDetail packet
      @setState
        selectedPacket: packet
    finally
      window.showModal
        title: __ "Paste Data"
        body: [<p>{__ "A battle packet was pasted from clipboard."}</p>,
               <p>{__ "If you see no battle detail, you may have a broken packet."}</p>]
        footer: null

  render: ->
    <div className="option-area">
      <Panel header={__ "Options"}>
        <Grid>
          <Row>
            <Col xs={6}>
            {
              options = []
              selectedIndex = -1  # Default: last battle (-1)
              selectedTimestamp = @state.selectedPacket?.poi_timestamp

              # Is selectedPacket in @props.battlePackets ?
              for packet, i in @props.battlePackets
                date = new Date(packet.poi_timestamp).toISOString()
                date = date.slice(0, 19).replace('T', ' ')
                comment = packet.poi_comment
                if packet.poi_timestamp == selectedTimestamp
                  selectedIndex = i
                options.push <option key={i} value={i}>{"#{date} #{comment}"}</option>

              # If selectedPacket exists but not in @props.battlePackets
              if selectedIndex < 0 and selectedTimestamp?
                selectedIndex = -2
                options.unshift <option key={-2} value={-2}>{__ "Selected battle"}</option>

              # Default option: last battle
              options.unshift <option key={-1} value={-1}>{__ "Last Battle"}</option>

              <Input type="select" ref="selectedIndex" value={selectedIndex} onChange={@handleSelectPacket}>
                {options}
              </Input>
            }
            </Col>
            <Col xs={3}>
              <Button bsStyle='primary' style={width: '100%'} onClick={@handleClickExport}>{__ "Copy Data"}</Button>
            </Col>
            <Col xs={3}>
            <Button bsStyle='primary' style={width: '100%'} onClick={@handleClickImport}>{__ "Paste Data"}</Button>
            </Col>
          </Row>
        </Grid>
      </Panel>
    </div>

module.exports = OptionArea
