import _ from 'lodash'
import path from 'path-extra'
import React, { useState, useRef } from 'react'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'
import { Card, Button, InputGroup } from '@blueprintjs/core'
import { shell } from 'electron'
import { Avatar } from 'views/components/etc/avatar'

import { showModal } from '../../modal-area'
import { themeSelector } from '../../selectors'
import { version as pluginVersion } from '../../../package.json'
import { getMapNodeLetterFuncSelector } from './selectors'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const steg = require('../../../assets/js/steganography.min.js')

const { POI_VERSION } = window
const { __ } = window.i18n['poi-plugin-battle-detail']

const battleReplayerURL = 'https://kc3kai.github.io/kancolle-replay/battleplayer.html'
const imagesPath = path.join(__dirname, 'assets', 'images')

interface ReplayGeneratorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rep: any
  effMapId: string
  getMapNodeLetter: (effMapId: string) => (edgeId: number | string) => string
  theme: string
}

const ReplayGeneratorImpl: React.FC<ReplayGeneratorProps> = ({
  rep, effMapId, getMapNodeLetter, theme,
}) => {
  const [disableSaveImage, setDisableSaveImage] = useState(false)
  const [comment, setComment] = useState('')
  const renderRoot = useRef<HTMLDivElement>(null)

  const { imageInfo, replayData } = rep
  const getNodeLetter = getMapNodeLetter(effMapId)

  const handleOpenReplayer = () => shell.openExternal(battleReplayerURL)

  const handleSaveImage = () => {
    const ref = renderRoot.current
    if (!ref) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const domToImage = (ref.ownerDocument.defaultView as any).domtoimage
    const computed = getComputedStyle(ref)
    const width = parseInt(computed.width, 10)
    const height = parseInt(computed.height, 10)
    setDisableSaveImage(true)
    domToImage
      .toPng(ref, { width, height })
      .then((dataUrl: string) => {
        const image = new Image()
        image.src = dataUrl
        image.onload = () => {
          const encoded = steg.encode(JSON.stringify(replayData), image)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(window as any).require('electron').remote.getCurrentWebContents().downloadURL(encoded)
          setDisableSaveImage(false)
        }
      })
      .catch((e: Error) => {
        console.error(`error while generating replay`, e)
        setDisableSaveImage(false)
      })
  }

  return (
    <div
      className={`theme-${theme}`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <Card>
        <div
          className="replay-render-root"
          id="replay-render-root"
          ref={renderRoot}
          style={{ width: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 5 }}
        >
          <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            <img
              src={path.join(imagesPath, 'poi-128x128.png')}
              alt="poi-logo"
              style={{ marginRight: 5 }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '2em', textAlign: 'center' }}>
                {imageInfo.desc}
              </div>
              <div style={{ fontSize: '.9em' }}>
                {imageInfo.timeStrs.length > 1
                  ? `${imageInfo.timeStrs[0]} ~ ${_.last(imageInfo.timeStrs)}`
                  : imageInfo.timeStrs[0]}
              </div>
              {imageInfo.routes.length > 0 && (
                <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', maxWidth: 200 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {imageInfo.routes.map((r: any, ind: number) => (
                    <div key={r.edge} style={{ position: 'relative', ...(ind > 0 ? { marginLeft: '.5em' } : {}) }}>
                      <img
                        src={path.join(imagesPath, `bg-${r.type}.png`)}
                        alt={`node-bg-${r.type}`}
                        style={{ width: 24, height: 24, opacity: 0.6 }}
                      />
                      <div style={{
                        fontSize: '1.2em', fontWeight: 'bold',
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}>
                        {getNodeLetter(r.edge)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {comment && (
            <div style={{ fontSize: '120%', fontWeight: 'bold' }}>{comment}</div>
          )}
          {imageInfo.fleets.length === 1 ? (
            <div className="fleet-view single-fleet" style={{ display: 'grid', grid: 'auto / 1fr 1fr' }}>
              {imageInfo.fleets[0].map((mstId: number) => (
                <Avatar mstId={mstId} key={mstId} height={50} />
              ))}
            </div>
          ) : (
            <div className="fleet-view combined-fleet" style={{ display: 'flex' }}>
              {imageInfo.fleets.map((fleet: number[], ind: number) => (
                <div key={`fleet-${ind}`} style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {fleet.map((mstId) => <Avatar mstId={mstId} key={mstId} height={45} />)}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: '75%' }}>
            Generated by battle-detail@{pluginVersion} poi@{POI_VERSION}
          </div>
        </div>
      </Card>
      <InputGroup
        style={{ margin: '.5em' }}
        type="text"
        placeholder={__('BrowseArea.ReplayGen.CommentPlaceholder')}
        value={comment}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
      />
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
        <Button disabled={disableSaveImage} onClick={handleSaveImage}>
          {__('Save as Image')}
        </Button>
        <Button onClick={handleOpenReplayer}>
          {__('BrowseArea.SortieOptions.OpenReplayer')}
        </Button>
      </div>
    </div>
  )
}

const ReplayGenerator = connect(
  createStructuredSelector({
    getMapNodeLetter: getMapNodeLetterFuncSelector,
    theme: themeSelector,
  }),
)(ReplayGeneratorImpl)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const openReplayGenerator = (rep: any, effMapId: string) => {
  showModal({
    title: __('BrowseArea.ReplayGen.GenerateKC3Replay'),
    body: <ReplayGenerator rep={rep} effMapId={effMapId} />,
  })
}
