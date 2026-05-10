import _ from 'lodash'
import { modifyObject } from 'subtender'
import { createStructuredSelector } from 'reselect'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import FontAwesome from 'react-fontawesome'
import { Card, Button, InputGroup } from '@blueprintjs/core'
import { Tooltip, HTMLTable } from '@blueprintjs/core'

import { browseModeSelector } from '../selectors'
import { SortieViewer } from './sortie-viewer'
import { actionCreators } from '../store'
import { UPagination } from './u-pagination'
import type { BattleIndex } from '../store/ext-root/indexes'
import type { UIState } from '../store/ext-root/ui'

const { __ } = window.i18n['poi-plugin-battle-detail']

const PAGE_ITEM_AMOUNT = 20

interface BrowseAreaProps {
  indexes: BattleIndex[]
  updateBattle: (id: number) => void
  browseMode: 'nodes' | 'sorties'
  uiModify: (modifier: (state: UIState) => UIState) => void
}

const BrowseAreaImpl: React.FC<BrowseAreaProps> = ({
  indexes: propIndexes, updateBattle, browseMode, uiModify,
}) => {
  const [pageNo, setPageNo] = useState(1)
  const [filteredIndexes, setFilteredIndexes] = useState(propIndexes)
  const [filters, setFilters] = useState({
    time: [''], desc: [''], map: [''], route: [''], rank: [''],
  })

  const iTime = useRef<HTMLInputElement>(null)
  const iDesc = useRef<HTMLInputElement>(null)
  const iMap = useRef<HTMLInputElement>(null)
  const iRoute = useRef<HTMLInputElement>(null)
  const iRank = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setFilteredIndexes(applyFilters(propIndexes, filters))
  }, [propIndexes])

  const applyFilters = useCallback((idxs: BattleIndex[], flt: typeof filters) => {
    return idxs.filter(index =>
      flt.time.findIndex(k => index.time.includes(k)) > -1 &&
      flt.desc.findIndex(k => index.desc.includes(k)) > -1 &&
      flt.map.findIndex(k => index.map.includes(k)) > -1 &&
      flt.route.findIndex(k => index.route.includes(k)) > -1 &&
      flt.rank.findIndex(k => index.rank.includes(k)) > -1,
    )
  }, [])

  const onClickFilter = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const SEPARATOR = ','
    const newFilters = {
      time: (iTime.current?.value ?? '').split(SEPARATOR),
      desc: (iDesc.current?.value ?? '').split(SEPARATOR),
      map: (iMap.current?.value ?? '').split(SEPARATOR),
      route: (iRoute.current?.value ?? '').split(SEPARATOR),
      rank: (iRank.current?.value ?? '').split(SEPARATOR),
    }
    if (_.isEqual(filters, newFilters)) return
    setPageNo(1)
    setFilters(newFilters)
    setFilteredIndexes(applyFilters(propIndexes, newFilters))
  }, [filters, propIndexes, applyFilters])

  const onRightClickFilter = useCallback(() => {
    if (iTime.current) iTime.current.value = ''
    if (iDesc.current) iDesc.current.value = ''
    if (iMap.current) iMap.current.value = ''
    if (iRoute.current) iRoute.current.value = ''
    if (iRank.current) iRank.current.value = ''
    onClickFilter()
  }, [onClickFilter])

  const handleSwitchBrowseMode = () =>
    uiModify(
      modifyObject('browseMode', (bm: string) =>
        bm === 'nodes' ? 'sorties' : 'nodes',
      ),
    )

  const pageAmount = filteredIndexes && filteredIndexes.length > 0
    ? Math.ceil(filteredIndexes.length / PAGE_ITEM_AMOUNT)
    : 1
  const range = _.range((pageNo - 1) * PAGE_ITEM_AMOUNT, pageNo * PAGE_ITEM_AMOUNT)

  const filterPopover = (
    <div style={{ padding: 8 }}>
      <p>{`1. ${__('Click "Filter" or press Enter to apply filter.')}`}</p>
      <p>{`2. ${__('Right click "Filter" to clear filter.')}`}</p>
      <p>{`3. ${__('Multi-value filter are separated by commas.')}`}</p>
    </div>
  )

  return (
    <div id="browse-area">
      <Card className="browse-view">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ flex: 1 }}>{__('Browse')}</div>
          <Button onClick={handleSwitchBrowseMode} style={{ margin: 0, width: 'initial' }}>
            {browseMode === 'nodes' ? __('BrowseArea.Nodes') :
              browseMode === 'sorties' ? __('BrowseArea.Sorties') : '???'}
          </Button>
        </div>
        <div style={browseMode === 'nodes' ? { overflowY: 'auto' } : { overflowY: 'auto', display: 'none' }}>
          <div style={{ marginBottom: '1em' }} className="tip">
            <span>{__('Tip') + ': '}</span>
            <span>{__('Tip_Akashic1_Part1')}</span>
            <span><FontAwesome name="info-circle" /></span>
            <span>{__('Tip_Akashic1_Part2')}</span>
          </div>
          <form onSubmit={onClickFilter}>
            <HTMLTable striped interactive className="browse-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th><InputGroup inputRef={iTime} placeholder={__('Time')} /></th>
                  <th><InputGroup inputRef={iDesc} placeholder={__('Description')} /></th>
                  <th><InputGroup inputRef={iMap} placeholder={__('Map')} /></th>
                  <th><InputGroup inputRef={iRoute} placeholder={__('Route')} /></th>
                  <th><InputGroup inputRef={iRank} placeholder={__('Rank')} /></th>
                  <th>
                    <Tooltip content={filterPopover} placement="top">
                      <Button
                        type="submit"
                        intent="primary"
                        onClick={onClickFilter}
                        onContextMenu={onRightClickFilter}
                      >
                        {__('Filter')}
                      </Button>
                    </Tooltip>
                  </th>
                </tr>
              </thead>
              <tbody>
                {range.map(i => {
                  const item = filteredIndexes[i]
                  return item == null ? null : (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{item.time}</td>
                      <td>{item.desc}</td>
                      <td>{item.map}</td>
                      <td>{item.route}</td>
                      <td>{item.rank}</td>
                      <td>
                        <div className="cbtn" onClick={() => updateBattle(item.id)}>
                          <FontAwesome name="info-circle" />{__('View')}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </HTMLTable>
          </form>
          <UPagination
            currentPage={pageNo}
            totalPages={pageAmount}
            onChange={setPageNo}
          />
        </div>
        <div
          className="sortie-viewer-wrap"
          style={browseMode === 'sorties' ? {} : { display: 'none' }}
        >
          <SortieViewer />
        </div>
      </Card>
    </div>
  )
}

const BrowseArea = connect(
  createStructuredSelector({ browseMode: browseModeSelector }),
  actionCreators,
)(BrowseAreaImpl)

export default BrowseArea
