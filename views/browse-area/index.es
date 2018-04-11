import _ from 'lodash'
import { modifyObject } from 'subtender'
import { createStructuredSelector } from 'reselect'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import FontAwesome from 'react-fontawesome'
import {
  Panel, Grid, Row, Col, Table,
  FormControl, Button, OverlayTrigger, Popover,
} from 'react-bootstrap'

import { browseModeSelector } from '../selectors'
import { SortieViewer } from './sortie-viewer'
import { actionCreators } from '../store'
import { UPagination } from './u-pagination'
import { PTyp } from '../ptyp'

const { __ } = window.i18n["poi-plugin-battle-detail"]

const PAGE_ITEM_AMOUNT = 20

class BrowseAreaImpl extends Component {
  static propTypes = {
    browseMode: PTyp.BrowseMode.isRequired,
    uiModify: PTyp.func.isRequired,
  }

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
      this.props.browseMode === nextProps.browseMode
    )
  }

  applyFilters = (indexes, filters) => {
    return indexes.filter((index, _i) => (
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
      pageNo : 1,
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

  onSelectPage = pageNo =>
    this.setState({pageNo})

  handleSwitchBrowseMode = () =>
    this.props.uiModify(
      modifyObject(
        'browseMode',
        bm =>
          /* eslint-disable indent */
          bm === 'nodes' ? 'sorties' :
          bm === 'sorties' ? 'nodes' :
          /* otherwise */ 'nodes'
          /* eslint-enable indent */
      )
    )

  render() {
    const {browseMode} = this.props
    const {indexes, pageNo} = this.state
    let pageAmount = 1, range = []
    if (indexes && indexes.length > 0) {
      pageAmount = Math.ceil(indexes.length / PAGE_ITEM_AMOUNT)
      range = _.range((pageNo - 1) * PAGE_ITEM_AMOUNT, pageNo * PAGE_ITEM_AMOUNT)
    }
    return (
      <div id="browse-area">
        <Panel
          className="browse-view"
        >
          <Panel.Heading>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <div style={{flex: 1}}>
                {__("Browse")}
              </div>
              <Button
                onClick={this.handleSwitchBrowseMode}
                style={{margin: 0, width: 'initial'}}
              >
                {
                  /* eslint-disable indent */
                  browseMode === 'nodes' ? __('BrowseArea.Nodes') :
                  browseMode === 'sorties' ? __('BrowseArea.Sorties') :
                  '???'
                  /* eslint-enable indent */
                }
              </Button>
            </div>
          </Panel.Heading>
          <Panel.Body>
            <div style={browseMode === 'nodes' ? {overflowY: 'auto'} : {overflowY: 'auto', display: 'none'}}>
              <Grid>
                <Row>
                  <Col
                    style={{marginBottom: '1em'}}
                    xs={12} className='tip'>
                    <span>{__('Tip') + ': '}</span>
                    <span>{__('Tip.Akashic1.Part1')}</span>
                    <span><FontAwesome name='info-circle' /></span>
                    <span>{__('Tip.Akashic1.Part2')}</span>
                  </Col>
                </Row>
              </Grid>
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
                    {
                      range.map(i => {
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
                      })
                    }
                  </tbody>
                </Table>
              </form>
              <UPagination
                currentPage={pageNo}
                totalPages={pageAmount}
                onChange={this.onSelectPage}
              />
            </div>
            <div
              className="sortie-viewer-wrap"
              style={browseMode === 'sorties' ? {} : {display: 'none'}}>
              <SortieViewer />
            </div>
          </Panel.Body>
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

const BrowseArea = connect(
  createStructuredSelector({
    browseMode: browseModeSelector,
  }),
  actionCreators
)(BrowseAreaImpl)

export default BrowseArea
