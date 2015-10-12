{React, ReactBootstrap} = window
{Panel, Grid, Row, Col, Button, Input} = ReactBootstrap

PacketDropdown = React.createClass
  render: ->
    

OptionArea = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    return false if @props.battlePacketsNonce == nextProps.battlePacketsNonce
    return true

  handleSelectPacket: (e) ->
    index = parseInt(e.target.value)
    return if index is NaN
    @props.handleSelectPacket index

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
              <Input type="select" defaultValue={-1} onChange={@handleSelectPacket}>
                {options}
              </Input>
            }
            </Col>
          </Row>
        </Grid>
      </Panel>
    </div>

module.exports = OptionArea
