import _ from 'lodash'
import FontAwesome from 'react-fontawesome'

const {React, ReactBootstrap, __} = window
const {Panel, Grid, Row, Col, Table, Pagination} = ReactBootstrap
const {FormControl, Button, OverlayTrigger, Popover} = ReactBootstrap

import { SortieViewer } from './sortie-viewer'

const PAGE_ITEM_AMOUNT = 20
const SORTIE_VIEWER_WIP = false

class BrowseArea extends React.Component {
  constructor() {
    super()
    this.state = {
      pageNo: 1,
      indexes: [],
      filters: {
        time : [''],
        desc : [''],
        map  : [''],
        route: [''],
        rank : [''],
      },
      // nodes / sorties
      viewMode: 'nodes',
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.indexes === nextProps.indexes)
      return
    this.setState({
      indexes: this.applyFilters(nextProps.indexes, this.state.filters),
    })
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(
      this.state.indexes === nextState.indexes &&
      this.state.pageNo === nextState.pageNo &&
      this.state.viewMode === nextState.viewMode
    )
  }

  applyFilters = (indexes, filters) => {
    return indexes.filter((index, i) => (
      filters.time .findIndex(keyword => index.time .includes(keyword)) > -1 &&
      filters.desc .findIndex(keyword => index.desc .includes(keyword)) > -1 &&
      filters.map  .findIndex(keyword => index.map  .includes(keyword)) > -1 &&
      filters.route.findIndex(keyword => index.route.includes(keyword)) > -1 &&
      filters.rank .findIndex(keyword => index.rank .includes(keyword)) > -1 &&
      true
    ))
  }

  onClickFilter = () => {
    const SEPARATOR = ','
    const time  = this.iTime.value
    const desc  = this.iDesc.value
    const map   = this.iMap .value
    const route = this.iRoute.value
    const rank  = this.iRank.value
    const filters = {
      time : time .split(SEPARATOR),
      desc : desc .split(SEPARATOR),
      map  : map  .split(SEPARATOR),
      route: route.split(SEPARATOR),
      rank : rank .split(SEPARATOR),
    }
    if (_.isEqual(this.state.filters, filters))
      return
    this.setState({
      indexes: this.applyFilters(this.props.indexes, filters),
      filters: filters,
    })
  }

  onRightClickFilter = () => {
    this.iTime .value = ''
    this.iDesc .value = ''
    this.iMap  .value = ''
    this.iRoute.value = ''
    this.iRank .value = ''
    this.onClickFilter()
  }

  onClickView = (id) => {
    this.props.updateBattle(id)
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

  handleViewModeRotate = () =>
    this.setState(st => {
      const {viewMode} = st
      const newViewMode =
        viewMode === 'nodes' ? 'sorties' :
        viewMode === 'sorties' ? 'nodes' :
        /* otherwise */ 'nodes'
      return {viewMode: newViewMode}
    })

  render() {
    const {indexes, pageNo, viewMode} = this.state
    let pageAmount = 1, range = []
    if (indexes && indexes.length > 0) {
      pageAmount = Math.ceil(indexes.length / PAGE_ITEM_AMOUNT)
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
        <Panel
          header={
            <div style={{display: 'flex', alignItems: 'center'}}>
              <div style={{flex: 1}}>
                {__("Browse")}
              </div>
              {
                SORTIE_VIEWER_WIP && (
                  <Button
                    onClick={this.handleViewModeRotate}
                    style={{margin: 0, width: 'initial'}}
                  >
                    {
                      /* eslint-disable indent */
                      viewMode === 'nodes' ? 'Nodes' :
                      viewMode === 'sorties' ? 'Sorties' :
                      '???'
                      /* eslint-enable indent */
                    }
                  </Button>
                )
              }
            </div>
          }>
          <div style={viewMode === 'nodes' ? {} : {display: 'none'}}>
            <form onSubmit={this.onClickFilter}>
              <Table className="browse-table" striped bordered condensed hover fill>
                <OverlayTrigger placement='top' overlay={
                  <Popover id="browse-filter-usage" title={__("Usage")}>
                    <div>{`1. ${__('Click "Filter" or press Enter to apply filter.')}`}</div>
                    <div>{`2. ${__('Right click "Filter" to clear filter.')}`}</div>
                    <div>{`3. ${__('Multi-value filter are separated by commas.')}`}</div>
                  </Popover>
                }>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th><FormControl inputRef={ref => this.iTime = ref} placeholder={__("Time")} /></th>
                      <th><FormControl inputRef={ref => this.iDesc = ref} placeholder={__("Description")} /></th>
                      <th><FormControl inputRef={ref => this.iMap  = ref} placeholder={__("Map")} /></th>
                      <th><FormControl inputRef={ref => this.iRoute= ref} placeholder={__("Route")} /></th>
                      <th><FormControl inputRef={ref => this.iRank = ref} placeholder={__("Rank")} /></th>
                      <th><Button type="submit" bsStyle='primary' onClick={this.onClickFilter} onContextMenu={this.onRightClickFilter}>{__("Filter")}</Button></th>
                    </tr>
                  </thead>
                </OverlayTrigger>
                <tbody>
                  {range.map(i => {
                     let item = indexes[i]
                     return (item == null) ? void 0 : (
                       <tr key={i}>
                         <td>{i + 1}</td>
                         <td>{item.time}</td>
                         <td>{item.desc}</td>
                         <td>{item.map}</td>
                         <td>{item.route}</td>
                         <td>{item.rank}</td>
                         <td><ViewButton onClick={() => this.onClickView(item.id)} /></td>
                       </tr>
                     )
                  })}
                </tbody>
              </Table>
            </form>
            <Pagination
              ellipsis
              boundaryLinks
              items={pageAmount}
              maxButtons={7}
              activePage={pageNo}
              onSelect={this.onSelectPage}
            />
          </div>
          <div style={viewMode === 'sorties' ? {} : {display: 'none'}}>
            <SortieViewer />
          </div>
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
