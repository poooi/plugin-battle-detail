import _ from 'lodash'
import { shell, clipboard } from 'electron'
import { compressToEncodedURIComponent } from 'lz-string'
import { createStructuredSelector } from 'reselect'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import Markdown from 'react-remarkable'
import {
  ListGroup, ListGroupItem,
  DropdownButton, MenuItem,
  Button, ButtonGroup,
} from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import {
  modifyObject,
  mergeMapStateToProps,
} from 'subtender'
import { fcdSelector } from 'views/utils/selectors'

import {
  sortieIndexesDomainSelector,
  getSortieIndexesFuncSelector,
  pageRangeSelector,
  currentFocusingSortieIndexesSelector,
} from './selectors'

import { sortieViewerSelector } from '../../selectors'
import { actionCreators } from '../../store'
import { convertReplay } from '../../../lib/convert-replay'
import { convertToDeckBuilder } from '../../../lib/deck-builder'
import { convertToWctf } from '../../../lib/wctf'
import { UPagination } from '../u-pagination'
import { PTyp } from '../../ptyp'
import { openReplayGenerator } from './replay-generator'

const { __ } = window.i18n["poi-plugin-battle-detail"]

const battleReplayerURL = 'https://kc3kai.github.io/kancolle-replay/battleplayer.html'

const pprMapId = mapId => {
  if (mapId === 'all')
    return __('All')
  if (mapId === 'pvp')
    return __('Practice')

  if (_.isInteger(mapId)) {
    const area = Math.floor(mapId / 10)
    const num = mapId % 10
    return `${area}-${num}`
  }
  return mapId
}

const rankColors = {
  'SS': '#ffeb3b',
  'S': '#ffeb3b',
  'A': '#b71c1c',
  'B': '#f4511e',
  'C': '#ffc400',
  'D': '#4caf50',
  'E': '#03a9f4',
}

class SortieViewerImpl extends PureComponent {
  static propTypes = {
    mapIds: PTyp.array.isRequired,
    getSortieIndexes: PTyp.func.isRequired,
    mapId: PTyp.oneOfType([PTyp.number, PTyp.string]).isRequired,
    activePage: PTyp.number.isRequired,
    pageRange: PTyp.number.isRequired,
    focusingSortieIndexes: PTyp.array.isRequired,
    fcdMap: PTyp.object.isRequired,
    sortBy: PTyp.shape({
      method: PTyp.MapAreaSortMethod.isRequired,
      reversed: PTyp.bool.isRequired,
    }).isRequired,

    uiModify: PTyp.func.isRequired,
  }

  modifySortieViewer = modifier =>
    this.props.uiModify(modifyObject('sortieViewer', modifier))

  handleMapIdChange = mapId => () =>
    this.modifySortieViewer(sv => {
      if (sv.mapId === mapId)
        return sv
      return {
        ...sv,
        mapId,
        activePage: 1,
      }
    })

  handleSelectPage = activePage =>
    this.modifySortieViewer(modifyObject('activePage', () => activePage))

  handleSelectBattle = index => () => {
    if (typeof window.showBattleWithTimestamp === 'function')
      window.showBattleWithTimestamp(index.id)
  }

  handleOpenReplayer = () =>
    shell.openExternal(battleReplayerURL)

  handleClickPlay = sortieIndexes => async () => {
    const {replayData: kc3ReplayData} = await convertReplay(sortieIndexes)
    const jsonRaw = JSON.stringify(kc3ReplayData)
    const encoded = compressToEncodedURIComponent(jsonRaw)
    shell.openExternal(`${battleReplayerURL}?fromLZString=${encoded}`)
  }

  handleGenerateReplay = sortieIndexes => async () =>
    openReplayGenerator(await convertReplay(sortieIndexes))

  handleCopyReplayToClipboard = sortieIndexes => async () => {
    const {replayData: kc3ReplayData} = await convertReplay(sortieIndexes)
    const jsonRaw = JSON.stringify(kc3ReplayData)
    clipboard.writeText(jsonRaw)
  }


  handleViewInDeckBuilder = sortieIndexes => async () => {
    const encoded =
      encodeURIComponent(JSON.stringify(await convertToDeckBuilder(sortieIndexes)))
    shell.openExternal(`http://kancolle-calc.net/deckbuilder.html?predeck=${encoded}`)
  }

  handleCopyDeckBuilderToClipboard = sortieIndexes => async () =>
    clipboard.writeText(JSON.stringify(await convertToDeckBuilder(sortieIndexes)))

  handleViewInWctf = sortieIndexes => async () => {
    const wData = await convertToWctf(sortieIndexes)
    const encoded = compressToEncodedURIComponent(JSON.stringify(wData))
    const rnd = Number(new Date())
    shell.openExternal(`http://fleet.diablohu.com/fleets/build/?i=${rnd}&d=${encoded}`)
  }

  handleClickSortMethod = method => () =>
    this.modifySortieViewer(
      modifyObject(
        'sortBy',
        sortBy => {
          if (sortBy.method === method) {
            // clicking same button causes the order to be reversed
            return {
              ...sortBy,
              reversed: !sortBy.reversed,
            }
          } else {
            return {
              ...sortBy,
              method,
              reversed: false,
            }
          }
        }
      )
    )

  render() {
    const {
      mapIds, mapId,
      pageRange, activePage,
      focusingSortieIndexes,
      sortBy,
      fcdMap,
    } = this.props
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: 5,
          }}
          className="tip">
          <div
            className="markdown"
            style={{flex: 1}}>
            <Markdown
              source={_.join(__('BrowseArea.SortieTipsMD'), '\n')}
            />
          </div>
          <Button
            style={{
              flex: 0,
              marginTop: 0,
              padding: '5px 10px',
            }}
            bsSize="xsmall"
            onClick={this.handleOpenReplayer}
          >
            {__('BrowseArea.SortieOptions.OpenReplayer')}
          </Button>
        </div>
        <div style={{display: 'flex', flex: 1}}>
          <div
            style={{
              width: '20%',
              minWidth: '10em',
              marginRight: 5,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <ButtonGroup
              style={{
                marginBottom: 5,
              }}
            >
              <Button
                onClick={this.handleClickSortMethod('recent')}
                bsStyle={
                  sortBy.method === 'recent' ?
                    'primary' :
                    'default'
                }
                style={{width: '50%'}}
              >
                <span>
                  {__('BrowseArea.SortMethod.recent')}
                </span>
                {
                  sortBy.method === 'recent' && (
                    <FontAwesome
                      style={{marginLeft: '.2em'}}
                      name={sortBy.reversed ? 'sort-desc' : 'sort-asc'}
                    />
                  )
                }
              </Button>
              <Button
                onClick={this.handleClickSortMethod('numeric')}
                bsStyle={
                  sortBy.method === 'numeric' ?
                    'primary' :
                    'default'
                }
                style={{width: '50%'}}
              >
                <span>
                  {__('BrowseArea.SortMethod.numeric')}
                </span>
                {
                  sortBy.method === 'numeric' && (
                    <FontAwesome
                      style={{marginLeft: '.2em'}}
                      name={
                        /*
                           intentionally reversed than 'recent'
                           as it looks more natural to have numeric values ascending
                         */
                        sortBy.reversed ? 'sort-asc' : 'sort-desc'
                      }
                    />
                  )
                }
              </Button>
            </ButtonGroup>
            <ListGroup
              style={{
                overflowY: 'auto',
                flex: 1,
              }}>
              {
                mapIds.map(curMapId => (
                  <ListGroupItem
                    key={curMapId}
                    onClick={this.handleMapIdChange(curMapId)}
                    style={{padding: '5px 10px'}}
                    fill>
                    <div className={curMapId === mapId ? 'text-primary' : ''}>
                      {pprMapId(curMapId)}
                    </div>
                  </ListGroupItem>
                ))
              }
            </ListGroup>
          </div>
          <div
            style={{flex: 1, display: 'flex', flexDirection: 'column'}}
          >
            <ListGroup style={{flex: 1, overflowY: 'auto'}}>
              {
                focusingSortieIndexes.map(si => {
                  const firstIndex = si.indexes[0]
                  const routes = _.get(fcdMap,[firstIndex.map,'route'])
                  const compId = firstIndex.id
                  const desc =
                    si.mapId === 'pvp' ? firstIndex.desc : `${__('Sortie')} ${pprMapId(si.mapId)}`
                  const timeDesc =
                    si.indexes.length === 1 ? firstIndex.time : `${firstIndex.time} ~ ${_.last(si.indexes).time}`
                  return (
                    <ListGroupItem
                      key={compId}
                      style={{padding: '5px 10px', display: 'flex'}}>
                      <div style={{flex: 1}}>
                        <div style={{display: 'flex'}}>
                          <div
                            style={{
                              flex: 1,
                              fontWeight: 'bold',
                              fontSize: '110%',
                            }}>{desc}</div>
                          <div>{timeDesc}</div>
                        </div>
                        <div style={{display: 'flex', flexWrap: 'wrap'}}>
                          {
                            si.indexes.map(index => (
                              <Button
                                bsSize="xsmall"
                                style={{
                                  marginRight: '.4em', width: '3.6em',
                                }}
                                onClick={this.handleSelectBattle(index)}
                                key={index.id}>
                                <div style={{
                                  fontWeight: 'bold',
                                  ...(index.rank in rankColors ? {color: rankColors[index.rank]} : {}),
                                }}>
                                  {
                                    index.map === '' ? 'PvP' :
                                      (_.isEmpty(routes) ? index.route_ : routes[index.route_][1])
                                  }
                                </div>
                              </Button>
                            ))
                          }
                        </div>
                      </div>
                      <DropdownButton
                        noCaret pullRight
                        style={{
                          width: '3em',
                          height: '3em',
                          marginLeft: '.4em',
                          // this is to get the icon on center
                          padding: 0,
                        }}
                        title={
                          <FontAwesome name="bars" />
                        }
                        id={`battle-detail-sortie-viewer-battle-${compId}`}
                      >
                        <MenuItem
                          onClick={this.handleClickPlay(si)}
                        >
                          {__('BrowseArea.SortieOptions.OpenInReplayer')}
                        </MenuItem>
                        <MenuItem
                          onClick={this.handleGenerateReplay(si)}
                        >
                          {__('BrowseArea.SortieOptions.GenerateReplay')}
                        </MenuItem>
                        <MenuItem
                          onClick={this.handleCopyReplayToClipboard(si)}
                        >
                          {__('BrowseArea.SortieOptions.CopyReplayToClipboard')}
                        </MenuItem>
                        <MenuItem divider />
                        <MenuItem
                          onClick={this.handleViewInDeckBuilder(si)}
                        >
                          {__('BrowseArea.SortieOptions.ViewInDeckBuilder')}
                        </MenuItem>
                        <MenuItem
                          onClick={this.handleCopyDeckBuilderToClipboard(si)}
                        >
                          {__('BrowseArea.SortieOptions.CopyDeckBuilderToClipboard')}
                        </MenuItem>
                        <MenuItem
                          onClick={this.handleViewInWctf(si)}
                        >
                          {__('BrowseArea.SortieOptions.ViewInWctf')}
                        </MenuItem>
                      </DropdownButton>
                    </ListGroupItem>
                  )
                })
              }
            </ListGroup>
            {
              (activePage <= pageRange) && (
                <UPagination
                  style={{marginBottom: '1em'}}
                  currentPage={activePage}
                  totalPages={pageRange}
                  onChange={this.handleSelectPage}
                />
              )
            }
          </div>
        </div>
      </div>
    )
  }
}

const SortieViewer = connect(
  mergeMapStateToProps(
    createStructuredSelector({
      mapIds: sortieIndexesDomainSelector,
      getSortieIndexes: getSortieIndexesFuncSelector,
      focusingSortieIndexes: currentFocusingSortieIndexesSelector,
      pageRange: pageRangeSelector,
      fcdMap: state => _.get(fcdSelector(state),'map',{}),
    }),
    sortieViewerSelector,
  ),
  actionCreators,
)(SortieViewerImpl)

export { SortieViewer }
