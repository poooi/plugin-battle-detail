{React, ReactBootstrap} = window
{Modal, Button} = ReactBootstrap

ModalArea = React.createClass
  componentDidMount: ->
    window.toggleModal = @handleToggleModal
  componentWillUnmount: ->
    window.toggleModal = null

  getInitialState: ->
    isShowModal: false
    title: null
    body: null
    callback: null

  handleToggleModal: (title, body, callback) ->
    @setState
      isShowModal: true
      title: title
      body: body
      callback: callback

  onHide: ->
    callback?()
    @setState
      isShowModal: false

  render: ->
    <Modal autoFocus={true}
           animation={true}
           show={@state.isShowModal}
           onHide={@onHide}>
      <Modal.Header>
        <Modal.Title>{@state.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {@state.body}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={@onHide}>{"Close"}</Button>
      </Modal.Footer>
    </Modal>

module.exports = ModalArea
