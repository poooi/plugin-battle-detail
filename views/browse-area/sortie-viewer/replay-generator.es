import _ from 'lodash'
import { join } from 'path-extra'
import React, { PureComponent } from 'react'
import { Panel } from 'react-bootstrap'
import { showModal } from '../../modal-area'
import { PTyp } from '../../ptyp'


class ReplayGenerator extends PureComponent {
  static propTypes = {
    rep: PTyp.object.isRequired,
  }

  render() {
    const {rep: {imageInfo}} = this.props
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
              style={{
                width: 400,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
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
                </div>
              </div>
              <div>{JSON.stringify(imageInfo.fleets)}</div>
              {
                imageInfo.routes.length > 0 && (
                  <div>{JSON.stringify(imageInfo.routes)}</div>
                )
              }
              <div>instructions</div>
            </div>
          </Panel.Body>
        </Panel>
      </div>
    )
  }
}

const openReplayGenerator = rep => {
  showModal({
    title: 'Generate KC3 Replay',
    body: (<ReplayGenerator rep={rep} />),
  })
}

export { openReplayGenerator }
