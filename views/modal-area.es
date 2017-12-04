import React from 'react'
import { connect } from 'react-redux'
import { Modal, Button } from 'react-bootstrap'
import { modifyObject } from 'subtender'

import { PTyp } from './ptyp'
import { actionCreators } from './store'
import { modalSelector } from './selectors'

const {__} = window

class ModalAreaImpl extends React.Component {
  static propTypes = {
    isShow: PTyp.bool,
    title: PTyp.node,
    body: PTyp.node,
    footer: PTyp.node,
    closable: PTyp.bool,
    uiModify: PTyp.func.isRequired,
  }

  static defaultProps = {
    isShow: false,
    title: null,
    body: null,
    footer: null,
    closable: false,
  }

  componentDidMount() {
    window.showModal = this.showModal
    window.hideModal = this.hideModal
  }

  componentWillUnmount() {
    window.showModal = null
    window.hideModal = null
  }

  modifyModal = modifier =>
    this.props.uiModify(modifyObject('modal', modifier))

  showModal = options => {
    if (options instanceof Object) {
      if (options.closable == null)
        options.closable = true
      this.modifyModal(() => ({
        isShow: true,
        title: options.title,
        body: options.body,
        footer: options.footer,
        closable: options.closable,
      }))
    }
  }

  hideModal = () =>
    this.modifyModal(modifyObject('isShow', () => false))

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
            {closable ? <Button bsStyle='primary' onClick={this.hideModal}>{__("Close")}</Button> : null}
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

const ModalArea = connect(
  modalSelector,
  actionCreators,
)(ModalAreaImpl)

export default ModalArea
