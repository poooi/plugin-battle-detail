{React, ReactBootstrap} = window
{Modal, Button} = ReactBootstrap

ModalArea = React.createClass
  componentDidMount: ->
    window.showModal = @showModal
  componentWillUnmount: ->
    window.showModal = null

  getInitialState: ->
    isShow: false
    title: null
    body: null
    footer: null

  showModal: (options) ->
    return unless options?
    @setState
      isShow: true
      title: options.title
      body: options.body
      footer: options.footer

  close: ->
    @setState
      isShow: false

  render: ->
    <Modal autoFocus={true} animation={true} show={@state.isShow} onHide={@close}>
      <Modal.Header>
        <Modal.Title>{@state.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {@state.body}
      </Modal.Body>
      <Modal.Footer>
        {@state.footer}
        <Button onClick={@close}>{"Close"}</Button>
      </Modal.Footer>
    </Modal>

module.exports = ModalArea
