{React, ReactBootstrap} = window
{Panel, Grid, Row, Col, Button, Input} = ReactBootstrap

PacketDropdown = React.createClass
  render: ->
    

OptionArea = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    return false if @props.battlePacketsNonce == nextProps.battlePacketsNonce
    return true

  getInitialState: ->
    autoShow: false

  handleSelectPacket: (e) ->
    index = parseInt(e.target.value)
    return if index is NaN
    @props.handleShowPacket index

  handleToggleAutoShow: (e) ->
    # <Col xs={4}>
    #   <Button bsStyle={if @state.autoShow then 'success' else 'danger'} onClick={@handleToggleAutoShow}>
    #     {if @state.autoShow then '√ ' else ''}{'Auto Show'}
    #   </Button>
    # </Col>
    @setState
      autoShow: !@state.autoShow

  render: ->
    <div className="option">
      <Panel header={"Options"}>
        <Grid>
          <Row>
            <Col xs={8}>
            {
              if @props.battlePackets?.length > 0
                options = []
                for packet, i in @props.battlePackets
                  dateObj = new Date(packet.poi_timestamp)
                  date = "#{dateObj.getFullYear()}-#{dateObj.getMonth() + 1}-#{dateObj.getDate()} #{dateObj.getHours()}:#{dateObj.getMinutes()}:#{dateObj.getSeconds()}"
                  comment = packet.poi_comment
                  options.push <option key={i} value={i}>{"#{date} #{comment}"}</option>
                <Input type="select" defaultValue={0} onChange={@handleSelectPacket}>
                  {options}
                </Input> 
              else
                <Input type="select" value={0} disabled>
                  <option key={0} value={0}>{"No battle"}</option>
                </Input>
            }
            </Col>
          </Row>
        </Grid>
      </Panel>
    </div>

module.exports = OptionArea
