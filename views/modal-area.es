import React from 'react'
import { createStructuredSelector } from 'reselect'
import { connect } from 'react-redux'
import { Modal, Button } from 'react-bootstrap'

import { PTyp } from './ptyp'
import { actionCreators } from './store'
import { modalSelector } from './selectors'

const {__} = window

class ModalAreaImpl extends React.Component {
  static propTypes = {
    value: PTyp.object,
    uiModify: PTyp.func.isRequired,
  }

  static defaultProps = {
    value: null,
  }

  constructor() {
    super()
    this.state = {
      isShow  : false,
      title   : null,
      body    : null,
      footer  : null,
      closable: false,
    }
  }

  componentDidMount() {
    window.showModal = this.showModal
    window.hideModal = this.hideModal
  }

  componentWillUnmount() {
    window.showModal = null
    window.hideModal = null
  }

  showModal = (options) => {
    if (options instanceof Object) {
      if (options.closable == null)
        options.closable = true
      this.setState({
        isShow  : true,
        title   : options.title,
        body    : options.body,
        footer  : options.footer,
        closable: options.closable,
      })
    }
  }
  hideModal = () => {
    this.setState({
      isShow: false,
    })
  }

  render() {
    let {isShow, title, body, footer, closable} = this.state
    if (body instanceof Array) {
      body = body.map((body, i) => <p key={i}>{body}</p> )
    }
    return (
      <div id="modal-area">
        <Modal autoFocus={true} animation={true} show={isShow} onHide={closable ? this.hideModal : void(0)}>
          <Modal.Header>
            <Modal.Title>{title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {body}
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
  createStructuredSelector({
    value: modalSelector,
  }),
  actionCreators,
)(ModalAreaImpl)

export default ModalArea
