"use strict"

const {clipboard} = require('electron')
const PacketManager = require('lib/packet-manager')

const {React, ReactBootstrap, FontAwesome, remote, $, __} = window
const {Panel, Grid, Row, Col, Button, ButtonGroup, Input} = ReactBootstrap

export class OptionArea extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !(
      this.props.battle === nextProps.battle
    )
  }

  onClickExport() {
    let isSuccessful = false
    try {
      const {battle} = this.props
      if (battle != null) {
        let data = JSON.stringify(battle)
        clipboard.writeText(data)
        isSuccessful = true
      }
    }
    catch (err) {
      // Do nothing
    }
    if (isSuccessful) {
      window.showModal({
        title: __("Copy Data"),
        body : [__("The battle packet was copied to clipboard."),
                __("You can send your friends the packet to share the battle.")],
      })
    } else {
      window.showModal({
        title: __("Copy Data"),
        body : __("Failed to copy battle packet to clipboard!"),
      })
    }
  }

  onClickImport() {
    try {
      const data = clipboard.readText()
      let battle = JSON.parse(data)
      this.props.updateBattle(battle)
    }
    finally {
      window.showModal({
        title: __("Paste Data"),
        body : [__("A battle packet was pasted from clipboard."),
                __("If you see no battle detail, you may have a broken packet.")],
      })
    }
  }

  onClickSave() {
    html2canvas($('#battle-area'), {
      onrendered: (canvas) =>
        remote.getCurrentWebContents().downloadURL(canvas.toDataURL()) ,
    })
  }

  render() {
    return (
      <div id="option-area">
        <Panel header={__("Options")}>
          <Grid>
            <Row>
              <Col xs={6}>
                <Input type="select"></Input>
              </Col>
              <Col xs={6}>
                <ButtonGroup>
                  <Button bsStyle='primary' style={{width: '100%'}} onClick={this.onClickExport}>{__("Copy Data")}</Button>
                  <Button bsStyle='primary' style={{width: '100%'}} onClick={this.onClickImport}>{__("Paste Data")}</Button>
                  <Button bsStyle='primary' style={{width: '100%'}} onClick={this.onClickSave}>{__("Save as Image")}</Button>
                </ButtonGroup>
              </Col>
            </Row>
            <Row>
              <Col xs={12} className='tip'>
                <span>{__('Tip') + ': '}</span>
                <span>{__('Tip.Akashic1.Part1')}</span>
                <span><FontAwesome name='info-circle' /></span>
                <span>{__('Tip.Akashic1.Part2')}</span>
              </Col>
            </Row>
          </Grid>
        </Panel>
      </div>
    )
  }
}

module.exports = OptionArea
