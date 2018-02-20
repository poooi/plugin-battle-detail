import _ from 'lodash'
import { join } from 'path-extra'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'
import { Panel, Button, FormControl } from 'react-bootstrap'
import { remote, shell } from 'electron'
import Markdown from 'react-remarkable'
import { Avatar } from 'views/components/etc/avatar'

import { showModal } from '../../modal-area'
import { getMapNodeLetterFuncSelector, themeSelector } from '../../selectors'
import { PTyp } from '../../ptyp'
import { version as pluginVersion } from '../../../package.json'
import domToImage from 'dom-to-image'
import steg from '../../../assets/js/steganography.min.js'

const {POI_VERSION, $, __} = window

/*
   replay image generation. kc3kai style png image with battle data encoded.

   - (1) prep necessary info (lib/convert-replay.es)

   - (2) popping up user dialog and layout replay image (this module)

      - user operations: save as img / upload (TODO) / close

   - (3) gen actual image and encoding

      - using https://github.com/petereigenschink/steganography.js

   TODO:

   - settings for switching between github / kcwiki reverse proxy

 */

const battleReplayerURL = 'https://kc3kai.github.io/kancolle-replay/battleplayer.html'
const imagesPath = join(__dirname, '..','..','..','assets','images')

class ReplayGeneratorImpl extends PureComponent {
  static propTypes = {
    rep: PTyp.object.isRequired,
    getMapNodeLetter: PTyp.func.isRequired,
    theme: PTyp.string.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      disableSaveImage: false,
      // optional user comment
      comment: '',
    }
  }

  handleOpenReplayer = () =>
    shell.openExternal(battleReplayerURL)

  handleChangeComment = e => {
    const comment = e.target.value
    this.setState({comment})
  }

  handleSaveImage = replayData => () => {
    const ref = $('#replay-render-root')
    const computed = getComputedStyle(ref)
    const width = parseInt(computed.width, 10)
    const height = parseInt(computed.height, 10)
    this.setState(
      {disableSaveImage: true},
      () =>
        domToImage
          .toPng(
            ref,
            {
              width, height,
            })
          .then(dataUrl => {
            const image = new Image()
            image.src = dataUrl
            image.onload = () => {
              /*
                 steg.encode won't wait for a dataURL to be fully loaded
                 therefore causing width & height to be not available sometimes.
                 in order to produce consistent and correct result, we wait until
                 image is fully loaded before next step.
               */
              const encoded = steg.encode(JSON.stringify(replayData), image)
              remote.getCurrentWebContents().downloadURL(encoded)
              this.setState({disableSaveImage: false})
            }
          })
          .catch(e => {
            console.error(`error while generating replay`, e)
            this.setState({disableSaveImage: false})
          })
    )
  }

  render() {
    const {rep: {imageInfo, replayData}, getMapNodeLetter, theme} = this.props
    const {disableSaveImage, comment} = this.state
    const getNodeLetter = getMapNodeLetter(imageInfo.mapId)
    if (imageInfo.fleets.length < 1 || imageInfo.fleets.length > 2) {
      console.warn(`unexpected number of fleets: ${imageInfo.fleets.length}`)
    }
    const instructions = __('BrowseArea.ReplayGen.InstructionsMD')

    return (
      <div
        className={`theme-${theme}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Panel>
          <Panel.Body>
            <div
              className="replay-render-root"
              id="replay-render-root"
              style={{
                width: 400,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 5,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                }}>
                <img
                  src={join(imagesPath, 'poi-128x128.png')}
                  alt="poi-logo"
                  style={{marginRight: 5}}
                />
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 'bold',
                      fontSize: '2em',
                      textAlign: 'center',
                    }}
                  >
                    {imageInfo.desc}
                  </div>
                  <div
                    style={{
                      fontSize: '.9em',
                    }}
                  >
                    {
                      imageInfo.timeStrs.length > 0 ?
                        (`${imageInfo.timeStrs[0]} ~ ${_.last(imageInfo.timeStrs)}`) :
                        imageInfo.timeStrs[0]
                    }
                  </div>
                  {
                    imageInfo.routes.length > 0 && (
                      <div
                        style={{
                          marginTop: 5,
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'center',
                          maxWidth: 200,
                        }}>
                        {
                          imageInfo.routes.map((r, ind) => (
                            <div
                              style={{
                                position: 'relative',
                                ...(ind > 0 ? {marginLeft: '.5em'} : {}),
                              }}
                              key={r.edge}
                            >
                              <img
                                src={join(imagesPath ,`bg-${r.type}.png`)}
                                alt={`node-bg-${r.type}`}
                                style={{width: 24, height: 24, opacity: 0.6}}
                              />
                              <div
                                style={{
                                  fontSize: '1.2em',
                                  fontWeight: 'bold',
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                }}
                              >
                                {getNodeLetter(r.edge)}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )
                  }
                </div>
              </div>
              {
                comment && (
                  <div
                    style={{
                      fontSize: '120%',
                      fontWeight: 'bold',
                    }}
                  >
                    {comment}
                  </div>
                )
              }
              {
                imageInfo.fleets.length === 1 ? (
                  <div
                    className="fleet-view single-fleet"
                    style={{
                      display: 'grid',
                      grid: `auto / 1fr 1fr`,
                    }}
                  >
                    {
                      imageInfo.fleets[0].map(mstId => {
                        return (
                          <Avatar
                            mstId={mstId}
                            key={mstId}
                            height={50}
                          />
                        )
                      })
                    }
                  </div>
                ) : (
                  <div
                    className="fleet-view combined-fleet"
                    style={{
                      display: 'flex',
                    }}
                  >
                    {
                      imageInfo.fleets.map((fleet, ind) => (
                        <div
                          key={`fleet-${ind}`}
                          style={{
                            width: '50%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}>
                          {
                            fleet.map(mstId => {
                              return (
                                <Avatar
                                  mstId={mstId}
                                  key={mstId}
                                  height={45}
                                />
                              )
                            })
                          }
                        </div>
                      ))
                    }
                  </div>
                )
              }
              {
                Array.isArray(instructions) && (
                  <div style={{marginTop: 10}}>
                    <Markdown
                      source={instructions.join('\n')}
                    />
                  </div>
                )
              }
              <div style={{fontSize: '75%'}}>
                Generated by battle-detail@{pluginVersion} poi@{POI_VERSION}
              </div>
            </div>
          </Panel.Body>
        </Panel>
        <FormControl
          style={{marginLeft: '.5em', marginRight: '.5em'}}
          type="text" placeholder={__('BrowseArea.ReplayGen.CommentPlaceholder')}
          value={comment}
          onChange={this.handleChangeComment}
        />
        <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
          <Button
            disabled={disableSaveImage}
            onClick={this.handleSaveImage(replayData)}>
            {__('Save as Image')}
          </Button>
          <Button
            onClick={this.handleOpenReplayer}
          >
            {__('BrowseArea.SortieOptions.OpenReplayer')}
          </Button>
        </div>
      </div>
    )
  }
}

const ReplayGenerator = connect(
  createStructuredSelector({
    getMapNodeLetter: getMapNodeLetterFuncSelector,
    theme: themeSelector,
  })
)(ReplayGeneratorImpl)

const openReplayGenerator = rep => {
  showModal({
    title: __('BrowseArea.ReplayGen.GenerateKC3Replay'),
    body: (<ReplayGenerator rep={rep} />),
  })
}

export { openReplayGenerator }
