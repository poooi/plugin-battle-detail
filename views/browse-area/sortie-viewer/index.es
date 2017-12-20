import _ from 'lodash'
import { shell } from 'electron'
import { compressToEncodedURIComponent } from 'lz-string'
import { createStructuredSelector } from 'reselect'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import {
  ListGroup, ListGroupItem,
  Pagination,
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
import { convertReplay } from 'lib/convert-replay'

import { PTyp } from '../../ptyp'

const {__} = window

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

  handleClickPlay = sortieIndexes => async () => {
    const kc3ReplayData = await convertReplay(sortieIndexes)
    // console.log(kc3ReplayData)
    const jsonRaw = JSON.stringify(kc3ReplayData)
    const encoded = compressToEncodedURIComponent(jsonRaw)
    shell.openExternal(`${battleReplayerURL}?fromLZString=${encoded}`)
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
      <div style={{display: 'flex'}}>
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
                  si.mapId === 'pvp' ? firstIndex.desc :
                    `${__('Sortie')} ${pprMapId(si.mapId)}`
                const timeDesc =
                  si.indexes.length === 1 ? firstIndex.time :
                    `${firstIndex.time} ~ ${_.last(si.indexes).time}`
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
                    <Button
                      onClick={this.handleClickPlay(si)}
                      style={{
                        width: '3em', height: '2.5em', marginLeft: '.4em',
                      }}>
                      <FontAwesome name="play" />
                    </Button>
                  </ListGroupItem>
                )
              })
            }
          </ListGroup>
          <Pagination
            style={{marginBottom: '1em'}}
            items={pageRange}
            activePage={activePage}
            prev
            next
            first
            last
            ellipsis
            boundaryLinks
            maxButtons={5}
            onSelect={this.handleSelectPage}
          />
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
