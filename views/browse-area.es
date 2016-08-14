"use strict"

const {React, ReactBootstrap, FontAwesome, __} = window
const {Panel, Grid, Row, Col, Table, Pagination} = ReactBootstrap

const PAGE_ITEM_AMOUNT = 20

class BrowseArea extends React.Component {
  constructor() {
    super()
    this.state = {
      pageNo: 1,
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(
      this.props.manifest === nextProps.manifest &&
      this.state.pageNo === nextState.pageNo
    )
  }

  onSelectPage = (eventKey) => {
    this.setState({
      pageNo: eventKey,
    })
  }

  onClickView = (id) => {
    this.props.updateBattle(id)
  }

  render() {
    const {manifest} = this.props
    const {pageNo} = this.state
    let pageAmount = 1, items = []
    if (manifest && manifest.length > 0) {
      pageAmount = Math.ceil(manifest.length / PAGE_ITEM_AMOUNT)
      items = manifest.slice((pageNo - 1) * PAGE_ITEM_AMOUNT, pageNo * PAGE_ITEM_AMOUNT)
    }
    return (
      <div id="browse-area">
        <Panel>
          <Grid>
            <Row>
              <Col xs={12} className='tip'>
                <span>{__('Tip') + ': '}</span>
                <span>{__('Tip.Akashic1.Part1')}</span>
                <span><FontAwesome name='info-circle' /></span>
                <span>{__('Tip.Akashic1.Part2')}</span>
              </Col>
            </Row>
          </Grid>
        </Panel>
        <Panel header={__("Browse")}>
          <Table striped bordered condensed hover fill>
            <thead>
              <tr>
                <th>#</th>
                <th>Time</th>
                <th>Map</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
            {items.map((item, i) =>
              <tr key={i}>
                <td>{i}</td>
                <td>{item.time}</td>
                <td>{item.map}</td>
                <td>{item.desc}</td>
                <td><ViewButton onClick={() => this.onClickView(item.id)} /></td>
              </tr>
            )}
            </tbody>
          </Table>
          <Pagination
            ellipsis
            boundaryLinks
            items={pageAmount}
            maxButtons={7}
            activePage={pageNo}
            onSelect={this.onSelectPage}
            />
        </Panel>
      </div>
    )
  }
}

class ViewButton extends React.Component {
  render() {
    return (
      <div className={'cbtn'} onClick={this.props.onClick}>
        {<FontAwesome name='info-circle' />}{__("View")}
      </div>
    )
  }
}

export default BrowseArea
