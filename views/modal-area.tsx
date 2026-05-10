import React from 'react'
import { connect } from 'react-redux'
import { modifyObject } from 'subtender'
import { Button, Classes } from '@blueprintjs/core'
import { Dialog } from 'views/components/etc/overlay'

import { boundActionCreators } from './store'
import { modalSelector } from './selectors'
import type { ModalState } from './store/ext-root/ui'

const { __ } = window.i18n['poi-plugin-battle-detail']

const modifyModal = (modifier: (modal: ModalState) => ModalState) =>
  boundActionCreators.uiModify(modifyObject('modal', modifier))

export const showModal = (options: {
  title?: React.ReactNode
  body?: React.ReactNode
  footer?: React.ReactNode
  closable?: boolean
}) => {
  if (options instanceof Object) {
    if (options.closable == null) options.closable = true
    modifyModal(() => ({
      isShow: true,
      title: options.title,
      body: options.body,
      footer: options.footer,
      closable: options.closable ?? true,
    }))
  }
}

export const hideModal = () =>
  modifyModal(modifyObject('isShow', () => false))

interface ModalAreaProps {
  isShow?: boolean
  title?: React.ReactNode
  body?: React.ReactNode
  footer?: React.ReactNode
  closable?: boolean
}

const ModalAreaImpl: React.FC<ModalAreaProps> = ({
  isShow = false, title, body, footer, closable = false,
}) => {
  const bodyNorm = Array.isArray(body)
    ? body.map((b, i: number) => <p key={i}>{b}</p>)
    : body

  return (
    <div id="modal-area">
      <Dialog
        isOpen={isShow}
        onClose={closable ? hideModal : undefined}
        title={title}
        canOutsideClickClose={closable}
        canEscapeKeyClose={closable}
      >
        <div className={Classes.DIALOG_BODY}>
          {bodyNorm}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            {footer}
            {closable && (
              <Button intent="primary" onClick={hideModal}>{__('Close')}</Button>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  )
}

const ModalArea = connect(modalSelector)(ModalAreaImpl)

export default ModalArea
