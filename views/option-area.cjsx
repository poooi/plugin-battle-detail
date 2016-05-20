"use strict"

{clipboard} = require 'electron'
{React, ReactBootstrap} = window
{Panel, Grid, Row, Col, Button, ButtonGroup, Input, Modal} = ReactBootstrap

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

  onSelectPacket: ->
    index = parseInt(@refs.selectedIndex.getValue())
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
        footer: null
    else
      window.showModal
        title: __ "Copy Data"
        body: [<p>{__ "Failed to copy battle packet to clipboard!"}</p>]
        footer: null

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
        footer: null

  onClickSave: ->
    html2canvas $('.battle-detail-area'),
      onrendered: (canvas) ->
        remote.getCurrentWebContents().downloadURL canvas.toDataURL()

  render: ->
    <div className="option-area">
      <Panel header={__ "Options"}>
        <Grid>
          <Row>
            <Col xs={6}>
            {
              options = []
              selectedIndex = -1  # Default: last battle (-1)
              selectedId = PacketManager.getId(@props.battle)

              # Is @props.battle in @props.battleList ?
              for battle, i in @props.battleList
                if selectedId == PacketManager.getId(battle)
                  selectedIndex = i
                options.push <option key={i} value={i}>{getDescription battle}</option>

              # If @props.battle exists but not in @props.battleList
              if selectedIndex == -1 and selectedId?
                selectedIndex = -2
                options.unshift <option key={-2} value={-2}>{__ "Selected"}: {getDescription @props.battle}</option>

              # Default option: last battle
              if @props.shouldAutoShow
                selectedIndex = -1
              options.unshift <option key={-1} value={-1}>{__ "Last Battle"}</option>

              <Input type="select" ref="selectedIndex" value={selectedIndex} onChange={@onSelectPacket}>
                {options}
              </Input>
            }
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
