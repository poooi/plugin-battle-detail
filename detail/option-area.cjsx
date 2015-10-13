{React, ReactBootstrap} = window
{Panel, Grid, Row, Col, Button, Input, Modal} = ReactBootstrap
clipboard = require 'clipboard'


OptionArea = React.createClass
  getInitialState: ->
    selectedTimestamp: 0
  shouldComponentUpdate: (nextProps, nextState) ->
    return true if @state.selectedTimestamp != nextState.selectedTimestamp
    return false if @props.battlePacketsNonce == nextProps.battlePacketsNonce
    return true

  handleSelectPacket: ->
    index = parseInt(@refs.selectedIndex.getValue())
    return if index is NaN
    if index == -1
      packet = @props.battlePackets[0]
      timestamp = 0
      @props.toggleAutoShow true
    else
      packet = @props.battlePackets[index]
      timestamp = packet.poi_timestamp
      @props.toggleAutoShow false

    @setState
      selectedTimestamp: timestamp
    @props.updateBattleDetail packet

  handleClickExport: ->
    index = parseInt(@refs.selectedIndex.getValue())
    return if index is NaN
    index = 0 if index == -1
    packet = @props.battlePackets[index]
    packet = JSON.stringify packet
    if packet
      clipboard.writeText(packet)
      window.showModal
        title: "Copy Packet"
        body: [<p>{__ "The battle packet was copied to clipboard."}</p>]
        footer: null

  handleClickImport: ->
    packet = clipboard.readText(packet)
    packet = JSON.parse packet
    if packet
      window.showModal
        title: "Paste Packet"
        body: [<p>{__ "A battle packet was pasted from clipboard."}</p>,
               <p>{__ "If you see no battle detail, you may have a broken packet."}</p>]
        footer: null
      @props.updateBattleDetail packet

  render: ->
    <div className="option-area">
      <Panel header={"Options"}>
        <Grid>
          <Row>
            <Col xs={6}>
            {
              options = []
              selectedIndex = -1
              options.push <option key={-1} value={-1}>{"Last Battle"}</option>
              for packet, i in @props.battlePackets
                date = new Date(packet.poi_timestamp).toISOString()
                date = date.slice(0, 19).replace('T', ' ')
                comment = packet.poi_comment
                if packet.poi_timestamp == @state.selectedTimestamp
                  selectedIndex = i
                options.push <option key={i} value={i}>{"#{date} #{comment}"}</option>

              <Input type="select" ref="selectedIndex" value={selectedIndex} onChange={@handleSelectPacket}>
                {options}
              </Input>
            }
            </Col>
            <Col xs={3}>
              <Button bsStyle='primary' style={width: '100%'} onClick={@handleClickExport}>{"Copy Packet"}</Button>
            </Col>
            <Col xs={3}>
            <Button bsStyle='primary' style={width: '100%'} onClick={@handleClickImport}>{"Paste Packet"}</Button>
            </Col>
          </Row>
        </Grid>
      </Panel>
    </div>

module.exports = OptionArea
