import React from 'react'
import { connect } from 'react-redux'
import { Modal, Button } from 'react-bootstrap'
import { modifyObject } from 'subtender'

import { PTyp } from './ptyp'
import { withBoundActionCreators } from './store'
import { modalSelector } from './selectors'

const {__} = window

withBoundActionCreators(bac => {
  const modifyModal = modifier =>
    bac.uiModify(modifyObject('modal', modifier))

  const showModal = options => {
    if (options instanceof Object) {
      if (options.closable == null)
        options.closable = true
      modifyModal(() => ({
        isShow: true,
        title: options.title,
        body: options.body,
        footer: options.footer,
        closable: options.closable,
      }))
    }
  }

  const hideModal = () =>
    modifyModal(modifyObject('isShow', () => false))

  window.showModal = showModal
  window.hideModal = hideModal
})

class ModalAreaImpl extends React.Component {
  static propTypes = {
    isShow: PTyp.bool,
    title: PTyp.node,
    body: PTyp.node,
    footer: PTyp.node,
    closable: PTyp.bool,
  }

  static defaultProps = {
    isShow: false,
    title: null,
    body: null,
    footer: null,
    closable: false,
  }

  render() {
    const {isShow, title, body, footer, closable} = this.props
    const bodyNorm = body instanceof Array ?
      body.map((body, i) => <p key={i}>{body}</p>) :
      body
    return (
      <div id="modal-area">
        <Modal
          autoFocus={true}
          animation={true}
          show={isShow}
          onHide={closable ? this.hideModal : null}
        >
          <Modal.Header>
            <Modal.Title>{title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {bodyNorm}
          </Modal.Body>
          <Modal.Footer>
            {footer}
            {closable ? <Button bsStyle='primary' onClick={window.hideModal}>{__("Close")}</Button> : null}
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

const ModalArea = connect(
  modalSelector,
)(ModalAreaImpl)

export default ModalArea
