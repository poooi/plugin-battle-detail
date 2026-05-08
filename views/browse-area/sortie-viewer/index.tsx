import _ from 'lodash'
import { shell, clipboard } from 'electron'
import { compressToEncodedURIComponent } from 'lz-string'
import { createStructuredSelector } from 'reselect'
import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import { List } from 'immutable'
import {
  Button, ButtonGroup, Menu, MenuItem, MenuDivider,
} from '@blueprintjs/core'
import { Popover } from 'views/components/etc/overlay'
import FontAwesome from 'react-fontawesome'
import { modifyObject } from 'subtender'

import {
  sortieIndexesDomainSelector,
  pageRangeSelector,
  currentFocusingSortieIndexesSelector,
} from './selectors'

import { sortieViewerSelector } from '../../selectors'
import { actionCreators } from '../../store'
import { convertReplay } from '../../../lib/convert-replay'
import { convertToDeckBuilder } from '../../../lib/deck-builder'
import { convertToWctf } from '../../../lib/wctf'
import { UPagination } from '../u-pagination'
import { openReplayGenerator } from './replay-generator'
import { parseEffMapId, getFcdMapInfoFuncSelector } from '../../store/records'

const { __ } = window.i18n['poi-plugin-battle-detail']

const battleReplayerURL = 'https://kc3kai.github.io/kancolle-replay/battleplayer.html'

const pprMapId = (eMapId: string): string => {
  if (eMapId === 'all') return __('All')
  if (eMapId === 'pvp') return __('Practice')
  const parsed = parseEffMapId(eMapId)
  if (parsed === null) return eMapId
  const suffix = (parsed as any).phase === 2 ? '' : ` (P${(parsed as any).phase})`
  return `${(parsed as any).mapArea}-${(parsed as any).mapNo}${suffix}`
}

const rankColors: Record<string, string> = {
  'SS': '#ffeb3b', 'S': '#ffeb3b', 'A': '#b71c1c',
  'B': '#f4511e', 'C': '#ffc400', 'D': '#4caf50', 'E': '#03a9f4',
}

interface SortieViewerProps {
  pageRange: number
  effMapIds: string[]
  focusingSortieIndexes: List<any>
  viewingMapId: string
  activePage: number
  sortBy: { method: 'recent' | 'numeric'; reversed: boolean }
  uiModify: (modifier: any) => void
  getFcdMapInfo: (effMapId: string) => any
}

const SortieViewerImpl: React.FC<SortieViewerProps> = ({
  effMapIds, viewingMapId, pageRange, activePage,
  focusingSortieIndexes, sortBy, uiModify, getFcdMapInfo,
}) => {
  const modifySortieViewer = useCallback(
    (modifier: any) => uiModify(modifyObject('sortieViewer', modifier)),
    [uiModify]
  )

  const handleViewingMapIdChange = (eMapId: string) => () =>
    modifySortieViewer((sv: any) => {
      if (sv.viewingMapId === eMapId) return sv
      return { ...sv, viewingMapId: eMapId, activePage: 1 }
    })

  const handleSelectPage = (page: number) =>
    modifySortieViewer(modifyObject('activePage', () => page))

  const handleSelectBattle = (index: any) => () => {
    if (typeof window.showBattleWithTimestamp === 'function')
      window.showBattleWithTimestamp(index.id)
  }

  const handleOpenReplayer = () => shell.openExternal(battleReplayerURL)

  const handleClickPlay = (si: any) => async () => {
    const { replayData: kc3ReplayData } = await convertReplay(si)
    const encoded = compressToEncodedURIComponent(JSON.stringify(kc3ReplayData))
    shell.openExternal(`${battleReplayerURL}?fromLZString=${encoded}`)
  }

  const handleGenerateReplay = (si: any) => async () => {
    openReplayGenerator(await convertReplay(si), si.effMapId)
  }

  const handleCopyReplayToClipboard = (si: any) => async () => {
    const { replayData: kc3ReplayData } = await convertReplay(si)
    clipboard.writeText(JSON.stringify(kc3ReplayData))
  }

  const handleViewInDeckBuilder = (si: any) => async () => {
    const encoded = encodeURIComponent(JSON.stringify(await convertToDeckBuilder(si)))
    shell.openExternal(`http://kancolle-calc.net/deckbuilder.html?predeck=${encoded}`)
  }

  const handleCopyDeckBuilderToClipboard = (si: any) => async () =>
    clipboard.writeText(JSON.stringify(await convertToDeckBuilder(si)))

  const handleViewInWctf = (si: any) => async () => {
    const wData = await convertToWctf(si)
    const encoded = compressToEncodedURIComponent(JSON.stringify(wData))
    const rnd = Number(new Date())
    shell.openExternal(`http://fleet.diablohu.com/fleets/build/?i=${rnd}&d=${encoded}`)
  }

  const handleClickSortMethod = (method: 'recent' | 'numeric') => () =>
    modifySortieViewer(
      modifyObject('sortBy', (sb: any) => {
        if (sb.method === method) return { ...sb, reversed: !sb.reversed }
        return { ...sb, method, reversed: false }
      })
    )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 5 }} className="tip">
        <div style={{ flex: 1 }}>
          {__('BrowseArea.SortieTipsMD')}
        </div>
        <Button small onClick={handleOpenReplayer}>
          {__('BrowseArea.SortieOptions.OpenReplayer')}
        </Button>
      </div>
      <div style={{ display: 'flex', flex: 1, height: 0 }}>
        <div style={{ width: '20%', minWidth: '10em', marginRight: 5, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <ButtonGroup style={{ marginBottom: 5 }}>
            <Button
              onClick={handleClickSortMethod('recent')}
              intent={sortBy.method === 'recent' ? 'primary' : 'none'}
              style={{ width: '50%' }}
            >
              {__('BrowseArea.SortMethod.recent')}
              {sortBy.method === 'recent' && (
                <FontAwesome style={{ marginLeft: '.2em' }} name={sortBy.reversed ? 'sort-desc' : 'sort-asc'} />
              )}
            </Button>
            <Button
              onClick={handleClickSortMethod('numeric')}
              intent={sortBy.method === 'numeric' ? 'primary' : 'none'}
              style={{ width: '50%' }}
            >
              {__('BrowseArea.SortMethod.numeric')}
              {sortBy.method === 'numeric' && (
                <FontAwesome style={{ marginLeft: '.2em' }} name={sortBy.reversed ? 'sort-asc' : 'sort-desc'} />
              )}
            </Button>
          </ButtonGroup>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {effMapIds.map(curEMapId => (
              <div
                key={curEMapId}
                onClick={handleViewingMapIdChange(curEMapId)}
                style={{
                  padding: '5px 10px', cursor: 'pointer',
                  color: curEMapId === viewingMapId ? 'var(--intent-primary, #137cbd)' : undefined,
                  borderBottom: '1px solid rgba(16,22,26,.15)',
                }}
              >
                {pprMapId(curEMapId)}
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {focusingSortieIndexes.toArray().map((si: any) => {
              const eMapId = si.effMapId
              const firstIndex = si.indexes[0]
              const routes = _.get(getFcdMapInfo(eMapId), 'route')
              const compId = firstIndex.id
              const desc = si.effMapId === 'pvp'
                ? firstIndex.desc
                : `${__('Sortie')} ${pprMapId(si.effMapId)}`
              const timeDesc = si.indexes.length === 1
                ? firstIndex.time
                : `${firstIndex.time} ~ ${_.last(si.indexes).time}`

              const dropdownMenu = (
                <Menu>
                  <MenuItem text={__('BrowseArea.SortieOptions.OpenInReplayer')} onClick={handleClickPlay(si)} />
                  <MenuItem text={__('BrowseArea.SortieOptions.GenerateReplay')} onClick={handleGenerateReplay(si)} />
                  <MenuItem text={__('BrowseArea.SortieOptions.CopyReplayToClipboard')} onClick={handleCopyReplayToClipboard(si)} />
                  <MenuDivider />
                  <MenuItem text={__('BrowseArea.SortieOptions.ViewInDeckBuilder')} onClick={handleViewInDeckBuilder(si)} />
                  <MenuItem text={__('BrowseArea.SortieOptions.CopyDeckBuilderToClipboard')} onClick={handleCopyDeckBuilderToClipboard(si)} />
                  <MenuItem text={__('BrowseArea.SortieOptions.ViewInWctf')} onClick={handleViewInWctf(si)} />
                </Menu>
              )

              return (
                <div key={compId} style={{ padding: '5px 10px', display: 'flex', borderBottom: '1px solid rgba(16,22,26,.15)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex' }}>
                      <div style={{ flex: 1, fontWeight: 'bold', fontSize: '110%' }}>{desc}</div>
                      <div>{timeDesc}</div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                      {si.indexes.map((index: any) => (
                        <Button
                          key={index.id}
                          small
                          style={{ marginRight: '.4em', width: '3.6em' }}
                          onClick={handleSelectBattle(index)}
                        >
                          <div style={{
                            fontWeight: 'bold',
                            ...(index.rank in rankColors ? { color: rankColors[index.rank] } : {}),
                          }}>
                            {index.map === '' ? 'PvP' :
                              (_.isEmpty(routes) ? index.route_ : routes[index.route_][1])}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Popover content={dropdownMenu} placement="bottom-end">
                    <Button
                      minimal
                      style={{ width: '3em', height: '3em', marginLeft: '.4em', padding: 0 }}
                      icon={<FontAwesome name="bars" />}
                    />
                  </Popover>
                </div>
              )
            })}
          </div>
          {activePage <= pageRange && (
            <UPagination
              style={{ marginBottom: '1em' }}
              currentPage={activePage}
              totalPages={pageRange}
              onChange={handleSelectPage}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export const SortieViewer = connect(
  (state: any) => {
    const svState = sortieViewerSelector(state)
    return {
      effMapIds: sortieIndexesDomainSelector(state),
      focusingSortieIndexes: currentFocusingSortieIndexesSelector(state),
      pageRange: pageRangeSelector(state),
      getFcdMapInfo: getFcdMapInfoFuncSelector(state),
      viewingMapId: svState.viewingMapId,
      activePage: svState.activePage,
      sortBy: svState.sortBy,
    }
  },
  actionCreators
)(SortieViewerImpl)
