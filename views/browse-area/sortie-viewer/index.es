import _ from 'lodash'
import { createStructuredSelector } from 'reselect'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import {
  ListGroup, ListGroupItem,
  Pagination,
  Button, ButtonGroup,
} from 'react-bootstrap'
import {
  modifyObject,
  mergeMapStateToProps,
} from 'subtender'

import {
  sortieIndexesDomainSelector,
  getSortieIndexesFuncSelector,
  pageRangeSelector,
  currentFocusingSortieIndexesSelector,
} from './selectors'

import { sortieViewerSelector } from '../../selectors'
import { actionCreators } from '../../store'

import { PTyp } from '../../ptyp'

const pprMapId = mapId => {
  if (mapId === 'all')
    return 'All'
  if (mapId === 'pvp')
    return 'Practice'

  if (_.isInteger(mapId)) {
    const area = Math.floor(mapId / 10)
    const num = mapId % 10
    return `${area}-${num}`
  }
  return mapId
}

class SortieViewerImpl extends PureComponent {
  static propTypes = {
    mapIds: PTyp.array.isRequired,
    getSortieIndexes: PTyp.func.isRequired,
    mapId: PTyp.oneOfType([PTyp.number, PTyp.string]).isRequired,
    activePage: PTyp.number.isRequired,
    pageRange: PTyp.number.isRequired,
    focusingSortieIndexes: PTyp.array.isRequired,

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

  render() {
    const {
      mapIds, mapId,
      pageRange, activePage,
      focusingSortieIndexes,
    } = this.props
    return (
      <div style={{display: 'flex', height: '80vh', alignItems: 'stretch'}}>
        <ListGroup
          style={{
            width: '20%',
            minWidth: '10em',
            marginRight: 5,
            overflowY: 'auto',
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
        <div
          style={{flex: 1, display: 'flex', flexDirection: 'column'}}
        >
          <ListGroup style={{flex: 1, overflowY: 'auto'}}>
            {
              focusingSortieIndexes.map(si => {
                const firstIndex = si.indexes[0]
                const compId = firstIndex.id
                const desc =
                  mapId === 'pvp' ? `Practive: ${firstIndex.desc}` :
                    `Sortie: ${pprMapId(si.mapId)}`
                const timeDesc =
                  si.indexes.length === 1 ? firstIndex.time :
                    `${firstIndex.time} ~ ${_.last(si.indexes).time}`
                return (
                  <ListGroupItem
                    key={compId} style={{padding: '5px 10px'}}>
                    <div>{desc}</div>
                    <div>{timeDesc}</div>
                    <div style={{display: 'flex', flexWrap: 'wrap'}}>
                      {
                        si.indexes.map(index => (
                          <Button
                            style={{marginRight: '1em', width: '6em'}}
                            onClick={this.handleSelectBattle(index)}
                            key={index.id}>
                            {index.route || 'Practice'}
                          </Button>
                        ))
                      }
                    </div>
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
    }),
    sortieViewerSelector,
  ),
  actionCreators,
)(SortieViewerImpl)

export { SortieViewer }
