"use strict"

const {React, ReactBootstrap, __} = window
const {Modal, Button} = ReactBootstrap

class ModalArea extends React.Component {
  constructor() {
    super()
    this.state = {
      isShow: false,
      title:  null,
      body:   null,
      footer: null,
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
      this.setState({
        isShow: true,
        title:  options.title,
        body:   options.body,
        footer: options.footer,
        closable: options.footer || true,
      })
    }
  }
  hideModal = () => {
    this.onHide()
  }

  onHide = () => {
    this.setState({
      isShow: false,
    })
  }

  render() {
    let {isShow, title, body, footer, closable} = this.state
    if (body instanceof Array) {
      body = body.map((body, i) => <div key={i}>{body}</div> )
    }
    return (
      <div id="modal-area">
        <Modal autoFocus={true} animation={true} show={isShow} onHide={closable ? this.onHide : null}>
          <Modal.Header>
            <Modal.Title>{title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {body}
          </Modal.Body>
          <Modal.Footer>
            {footer}
            {closable ? <Button onClick={this.onHide}>{__("Close")}</Button> : null}
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

export default ModalArea
