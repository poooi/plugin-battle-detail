"use strict"

const {React, ReactBootstrap, _, __} = window
const {Button, ButtonGroup, Table, Pagination} = ReactBootstrap

const PAGE_ITEM_AMOUNT = 50

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

  onClickShow = (id) => {
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
        <Table striped bordered condensed hover>
          <thead>
            <tr>
              <th>Time</th>
              <th>Map</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
          {items.map((item, i) =>
            <tr key={i}>
              <td>{item.time}</td>
              <td>{item.map}</td>
              <td>{item.desc}</td>
              <td>
                <Button onClick={() => this.onClickShow(item.id)}>{__("View")}</Button>
              </td>
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
      </div>
    )
  }
}

export default BrowseArea
