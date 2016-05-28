"use strict"

{clipboard} = require 'electron'
{React, ReactBootstrap} = window
{Panel, Grid, Row, Col, Button, ButtonGroup, Input} = ReactBootstrap

PacketManager = require('../lib/packet-manager')


getDescription = (packet) ->
  desc = []
  desc.push PacketManager.getTime(packet)
  desc.push PacketManager.getDesc(packet)
  return desc.join(' ')


OptionArea = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    return not (
      @props.battleListNonce == nextProps.battleListNonce and
      @props.battleNonce == nextProps.battleNonce and
      @props.shouldAutoShow == nextProps.shouldAutoShow
    )

  onSelectPacket: (e) ->
    index = parseInt(e.target.value)
    return if index is NaN
    if index < 0
      @props.updateBattle null
    else
      battle = @props.battleList[index]
      @props.updateBattle battle

  onClickExport: ->
    isSuccessful = false
    try
      battle = @props.battle
      if battle isnt null
        battle = JSON.stringify(battle)
        clipboard.writeText(battle)
        isSuccessful = true
    catch e
      # do nothing

    if isSuccessful
      window.showModal
        title: __ "Copy Data"
        body: [<p>{__ "The battle packet was copied to clipboard."}</p>,
               <p>{__ "You can send your friends the packet to share the battle."}</p>]
    else
      window.showModal
        title: __ "Copy Data"
        body: [<p>{__ "Failed to copy battle packet to clipboard!"}</p>]

  onClickImport: ->
    try
      battle = clipboard.readText(battle)
      battle = JSON.parse(battle)
      @props.updateBattle battle
    finally
      window.showModal
        title: __ "Paste Data"
        body: [<p>{__ "A battle packet was pasted from clipboard."}</p>,
               <p>{__ "If you see no battle detail, you may have a broken packet."}</p>]

  onClickSave: ->
    html2canvas $('#detail-area'),
      onrendered: (canvas) ->
        remote.getCurrentWebContents().downloadURL canvas.toDataURL()

  render: ->
    # Selected Index
    # -1: last battle (default)
    # -2: battle not in @props.battleList
    # 0+: @props.battleList[i]
    selected = -1
    options = []
    selectedId = PacketManager.getId(@props.battle)
    # Is @props.battle in @props.battleList ?
    for battle, i in @props.battleList
      if selectedId == PacketManager.getId(battle)
        selected = i
      options.push
        index: i
        text: getDescription(battle)
    # If @props.battle exists but not in @props.battleList
    if selectedId? and selected == -1
      selected = -2
      options.unshift
        index: -2
        text: "#{__("Selected")}: #{getDescription(@props.battle)}"
    # Show last battle if automatically show last
    if @props.shouldAutoShow
      selected = -1
    options.unshift
      index: -1
      text: __("Last Battle")
    # <FormControl componentClass="select" value={selected} onChange={@onSelectPacket}>
    #   {options.map(({index, text}) => <option key={index} value={index}>{text}</option> )}
    # </FormControl>

    <div id="option-area">
      <Panel header={__ "Options"}>
        <Grid>
          <Row>
            <Col xs={6}>
              <Input type="select" value={selected} onChange={@onSelectPacket}>
              {
                for opt in options
                  <option key={opt.index} value={opt.index}>{opt.text}</option>
              }
              </Input>
            </Col>
            <Col xs={6}>
              <ButtonGroup>
                <Button bsStyle='primary' style={width: '100%'} onClick={@onClickExport}>{__ "Copy Data"}</Button>
                <Button bsStyle='primary' style={width: '100%'} onClick={@onClickImport}>{__ "Paste Data"}</Button>
                <Button bsStyle='primary' style={width: '100%'} onClick={@onClickSave}>{__ "Save as image"}</Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Grid>
      </Panel>
    </div>

module.exports = OptionArea
