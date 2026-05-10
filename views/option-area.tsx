import React, { memo } from 'react'
import * as remote from '@electron/remote'
import { Button, ButtonGroup, InputGroup } from '@blueprintjs/core'
import type { Battle } from 'poi-lib-battle'

import { showModal } from './modal-area'
import { PacketCompat } from '../lib/compat'

const { clipboard } = remote
const { __ } = window.i18n['poi-plugin-battle-detail']

interface OptionAreaProps {
  battle: Battle | null
  updateBattle: (id: number | Battle | null) => void
  battleArea: React.RefObject<HTMLDivElement>
}

const OptionArea: React.FC<OptionAreaProps> = memo(({ battle, updateBattle, battleArea }) => {
  const onClickExport = () => {
    let isSuccessful = false
    try {
      if (battle != null) {
        clipboard.writeText(JSON.stringify(battle))
        isSuccessful = true
      }
    } catch (_err) {
      // Do nothing
    }
    if (isSuccessful) {
      showModal({
        title: __('Copy Data'),
        body: [
          __('The battle packet was copied to clipboard.'),
          __('You can send your friends the packet to share the battle.'),
        ],
      })
    } else {
      showModal({
        title: __('Copy Data'),
        body: __('Failed to copy battle packet to clipboard!'),
      })
    }
  }

  const onClickImport = () => {
    try {
      const data = clipboard.readText()
      const parsed = JSON.parse(data)
      updateBattle(parsed)
    } finally {
      showModal({
        title: __('Paste Data'),
        body: [
          __('A battle packet was pasted from clipboard.'),
          __('If you see no battle detail, you may have a broken packet.'),
        ],
      })
    }
  }

  const onClickSave = () => {
    const ref = battleArea.current
    if (!ref) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const domToImage = (ref.ownerDocument.defaultView as any).domtoimage
    const computed = getComputedStyle(ref)
    const width = parseInt(computed.width, 10)
    const height = parseInt(computed.height, 10)
    domToImage.toPng(ref, {
      bgcolor: document.body.style.backgroundColor || window.isVibrant ? 'rgba(38,38,38,0.8)' : undefined,
      width, height,
    })
      .then((dataUrl: string) => remote.getCurrentWebContents().downloadURL(dataUrl))
      .catch((e: Error) => console.error(`error while generating battle detail img`, e))
  }

  const title = battle == null ? '' : PacketCompat.fmtTitle(battle)

  return (
    <div id="option-area">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
        <InputGroup
          className='optional-area-input'
          disabled
          value={title}
          readOnly
        />
        <ButtonGroup>
          <Button intent="primary" onClick={onClickExport}>{__('Copy Data')}</Button>
          <Button intent="primary" onClick={onClickImport}>{__('Paste Data')}</Button>
          <Button intent="primary" onClick={onClickSave}>{__('Save as Image')}</Button>
        </ButtonGroup>
      </div>
    </div>
  )
}, (prev, next) => prev.battle === next.battle)

export default OptionArea
