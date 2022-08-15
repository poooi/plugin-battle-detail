import { remote } from 'electron'
import React from 'react'
import {
  Panel,
  Grid, Row, Col,
  Button, ButtonGroup,
  FormControl,
} from 'react-bootstrap'

import { showModal } from './modal-area'
import { PacketCompat } from '../lib/compat'

const {clipboard} = require('electron')
const { __ } = window.i18n["poi-plugin-battle-detail"]

class OptionArea extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !(
      this.props.battle === nextProps.battle
    )
  }

  onClickExport = () => {
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
      showModal({
        title: __("Copy Data"),
        body : [__("The battle packet was copied to clipboard."),
          __("You can send your friends the packet to share the battle.")],
      })
    } else {
      showModal({
        title: __("Copy Data"),
        body : __("Failed to copy battle packet to clipboard!"),
      })
    }
  }

  onClickImport = () => {
    try {
      const data = clipboard.readText()
      let battle = JSON.parse(data)
      this.props.updateBattle(battle)
    }
    finally {
      showModal({
        title: __("Paste Data"),
        body : [__("A battle packet was pasted from clipboard."),
          __("If you see no battle detail, you may have a broken packet.")],
      })
    }
  }

  onClickSave = () => {
    const ref = this.props.battleArea.current
    const domToImage = ref.ownerDocument.defaultView.domtoimage
    const computed = getComputedStyle(ref)
    const width = parseInt(computed.width, 10)
    const height = parseInt(computed.height, 10)
    domToImage.toPng(ref, {
      bgcolor: document.body.style.backgroundColor || window.isVibrant ? "rgba(38,38,38,0.8)" : undefined,
      width, height,
    }
    ).then(dataUrl =>
      remote.getCurrentWebContents().downloadURL(dataUrl)
    ).catch(e =>
      console.error(`error while generating battle detail img`, e)
    )
  }

  render() {
    const {battle} = this.props
    let title = battle == null ? '' : PacketCompat.fmtTitle(battle)
    return (
      <div id="option-area">
        <Panel>
          <Panel.Body>
            <Grid>
              <Row>
                <Col xs={6}>
                  <FormControl disabled value={title}></FormControl>
                </Col>
                <Col xs={6}>
                  <ButtonGroup>
                    <Button bsStyle='primary' onClick={this.onClickExport}>{__("Copy Data")}</Button>
                    <Button bsStyle='primary' onClick={this.onClickImport}>{__("Paste Data")}</Button>
                    <Button bsStyle='primary' onClick={this.onClickSave}>{__("Save as Image")}</Button>
                  </ButtonGroup>
                </Col>
              </Row>
            </Grid>
          </Panel.Body>
        </Panel>
      </div>
    )
  }
}

export default OptionArea
