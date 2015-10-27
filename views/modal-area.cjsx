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
    <div className="modal-area">
      <Modal autoFocus={true} animation={true} show={@state.isShow} onHide={@close}>
        <Modal.Header>
          <Modal.Title>{@state.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {
            if @state.body instanceof Array
              for body, i in @state.body
                <div key={i}>{body}</div>
            else
              @state.body
          }
        </Modal.Body>
        <Modal.Footer>
          {@state.footer}
          <Button onClick={@close}>{__ "Close"}</Button>
        </Modal.Footer>
      </Modal>
    </div>

module.exports = ModalArea
