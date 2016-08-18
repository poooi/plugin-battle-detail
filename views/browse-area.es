"use strict"

const {React, ReactBootstrap, FontAwesome, _, __} = window
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

  onSelectPage = (key, key2) => {
    // Compatibility: React Bootstrap v0.28
    if (key2.eventKey != null) {
      key = key2.eventKey
    }
    this.setState({
      pageNo: key,
    })
  }

  onClickView = (id) => {
    this.props.updateBattle(id)
  }

  render() {
    const {manifest} = this.props
    const {pageNo} = this.state
    let pageAmount = 1, range = []
    if (manifest && manifest.length > 0) {
      pageAmount = Math.ceil(manifest.length / PAGE_ITEM_AMOUNT)
      range = _.range((pageNo - 1) * PAGE_ITEM_AMOUNT, pageNo * PAGE_ITEM_AMOUNT)
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
                <th style={{width: '10%'}}>#</th>
                <th style={{width: '30%'}}>{__("Time")}</th>
                <th style={{width: '20%'}}>{__("Map")}</th>
                <th style={{width: '25%'}}>{__("Description")}</th>
                <th style={{width: '15%'}}></th>
              </tr>
            </thead>
            <tbody>
            {range.map(i => {
              let item = manifest[i]
              return (item == null) ? void 0 : (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{item.time}</td>
                  <td>{item.map}</td>
                  <td>{item.desc}</td>
                  <td><ViewButton onClick={() => this.onClickView(item.id)} /></td>
                </tr>
              )
            })}
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
