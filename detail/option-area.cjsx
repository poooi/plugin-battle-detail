{React, ReactBootstrap} = window
{Panel, Grid, Row, Col, Button, Input, Modal} = ReactBootstrap
clipboard = require 'clipboard'


OptionArea = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    return false if @props.battlePacketsNonce == nextProps.battlePacketsNonce
    return true

  handleSelectPacket: ->
    index = parseInt(@refs.selectedIndex.getValue())
    return if index is NaN
    if index == -1
      index = 0
      @props.toggleAutoShow true
    else
      @props.toggleAutoShow false
    packet = @props.battlePackets[index]
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
        title: "Export"
        body: "The battle packet was exported to clipboard."
        footer: null

  handleClickImport: ->
    packet = clipboard.readText(packet)
    packet = JSON.parse packet
    if packet
      @props.updateBattleDetail packet
      window.showModal
        title: "Import"
        body: "A battle packet was imported from clipboard.\nYou may have a broken packet if you see no battle detail."
        footer: null

  render: ->
    <div className="option">
      <Panel header={"Options"}>
        <Grid>
          <Row>
            <Col xs={8}>
            {
              options = []
              options.push <option key={-1} value={-1}>{"Last Battle"}</option>
              for packet, i in @props.battlePackets
                date = new Date(packet.poi_timestamp).toISOString()
                date = date.slice(0, 19).replace('T', ' ')
                comment = packet.poi_comment
                options.push <option key={i} value={i}>{"#{date} #{comment}"}</option>

              <Input type="select" ref="selectedIndex" defaultValue={-1} onChange={@handleSelectPacket}>
                {options}
              </Input>
            }
            </Col>
            <Col xs={2}>
              <Button bsStyle='primary' style={width: '100%'} onClick={@handleClickExport}>{"Export"}</Button>
            </Col>
            <Col xs={2}>
              <Button bsStyle='primary' style={width: '100%'} onClick={@handleClickImport}>{"Import"}</Button>
            </Col>
          </Row>
        </Grid>
      </Panel>
    </div>

module.exports = OptionArea
