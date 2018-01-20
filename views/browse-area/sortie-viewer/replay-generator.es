import _ from 'lodash'
import { join } from 'path-extra'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'
import { Panel, Button } from 'react-bootstrap'
import Markdown from 'react-remarkable'
import { Avatar } from 'views/components/etc/avatar'

import { showModal } from '../../modal-area'
import { getMapNodeLetterFuncSelector } from '../../selectors'
import { PTyp } from '../../ptyp'
import { version as pluginVersion } from '../../../package.json'
import domToImage from 'dom-to-image'

const {POI_VERSION, $, remote} = window

class ReplayGeneratorImpl extends PureComponent {
  static propTypes = {
    rep: PTyp.object.isRequired,
    getMapNodeLetter: PTyp.func.isRequired,
  }

  handleSaveImage = () => {
    domToImage
      .toPng(
        $('#replay-render-root'),
        {
          bgcolor: /* TODO: theme dependent, from .panel */ '#303030',
          width: 400,
        })
      .then(dataUrl => {
        remote.getCurrentWebContents().downloadURL(dataUrl)
      })
  }

  render() {
    const {rep: {imageInfo}, getMapNodeLetter} = this.props
    const getNodeLetter = getMapNodeLetter(imageInfo.mapId)
    if (imageInfo.fleets.length < 1 || imageInfo.fleets.length > 2) {
      console.warn(`unexpected number of fleets: ${imageInfo.fleets.length}`)
    }

    return (
      <div
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
                  src={join(__dirname, '..','..','..','assets','poi-128x128.png')}
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
                                src={join(__dirname, '..','..','..','assets',`bg-${r.type}.png`)}
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
              <div style={{marginTop: 10}}>
                <Markdown
                  source={[
                    'This image contains battle replay data, which can be played using:',
                    '',
                    '> http://bit.ly/1MU1z7y',
                    '',
                    'If you want to share your replay, please make sure to use lossless image sharing services',
                    'in order to keep battle replay data intact.',
                  ].join('\n')}
                />
              </div>
              <div style={{fontSize: '75%'}}>
                Generated by battle-detail@{pluginVersion} poi@{POI_VERSION}
              </div>
            </div>
          </Panel.Body>
        </Panel>
        <Button onClick={this.handleSaveImage}>
          Save Image
        </Button>
      </div>
    )
  }
}

const ReplayGenerator = connect(
  createStructuredSelector({
    getMapNodeLetter: getMapNodeLetterFuncSelector,
  })
)(ReplayGeneratorImpl)

const openReplayGenerator = rep => {
  showModal({
    title: 'Generate KC3 Replay',
    body: (<ReplayGenerator rep={rep} />),
  })
}

export { openReplayGenerator }
