import _ from 'lodash'
import React, { useState } from 'react'
import { Card, Collapse } from '@blueprintjs/core'
import FontAwesome from 'react-fontawesome'

import { getShipName } from './utils'
import { equipIsAircraft } from 'views/utils/game-utils'
import { SlotitemIcon } from 'views/components/etc/icon'

import { FABar, HPBar } from './bar'
import type { Simulator, Ship, RawFleetShip, RawLBAC, RawSlotItem } from 'poi-lib-battle'

const { ROOT, getStore } = window
const { __ } = window.i18n['poi-plugin-battle-detail']

type PoiAirBasePlane = RawLBAC['api_plane_info'][number] & { poi_slot?: RawSlotItem | null }

const OverviewArea: React.FC<{ simulator: Simulator }> = ({ simulator }) => {
  const [expanded, setExpanded] = useState(true)

  return (
    <div id="overview-area">
      <Card>
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setExpanded(e => !e)}
        >
          <h5 className="bp5-heading" style={{ margin: 0, flex: 1 }}>{__('Battle Overview')}</h5>
          <FontAwesome name={expanded ? 'caret-up' : 'caret-down'} />
        </div>
        <Collapse isOpen={expanded}>
          {simulator ? (
            <div style={{ marginTop: 8 }}>
              <FleetView fleet={simulator.mainFleet} title={__('Main Fleet')} />
              <FleetView fleet={simulator.escortFleet} title={__('Escort Fleet')} />
              <FleetView fleet={simulator.supportFleet} title={__('Support Fleet')} />
              <FleetView fleet={simulator.landBaseAirCorps as RawLBAC[]} title={__('Land Base Air Corps')} View={LBACView} />
              <FleetView fleet={simulator.friendFleet} title={__('Friendly Fleet')} />
              <FleetView fleet={simulator.enemyFleet} title={__('Enemy Fleet')} />
              <FleetView fleet={simulator.enemyEscort} title={__('Enemy Escort Fleet')} />
            </div>
          ) : __('No battle')}
        </Collapse>
      </Card>
    </div>
  )
}

interface FleetViewProps<T = Ship | null> {
  fleet: T[] | null | undefined
  title: string
  View?: React.FC<{ child: T }>
}

function FleetView<T = Ship | null>({ fleet, title, View }: FleetViewProps<T>) {
  if (!(fleet && fleet.length > 0)) return <div />
  const Component = (View ?? ShipView) as React.FC<{ child: T }>
  const rows: [T, T][] = []
  for (let i = 0; i < Math.ceil(fleet.length / 2); i++) {
    rows.push([fleet[2 * i], fleet[2 * i + 1]])
  }
  return (
    <div className="fleet-view">
      <div className="fleet-title">{title}</div>
      <div>
        {rows.map(([a, b], i) => (
          <div key={i} style={{ display: 'flex' }}>
            <div style={{ flex: 1 }}><Component child={a} /></div>
            <div style={{ flex: 1 }}><Component child={b} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

const getCondClass = (cond: number | null | undefined): string => {
  if (cond == null) return ''
  if (cond >= 50) return 'poi-ship-cond-50'
  if (cond >= 30) return 'poi-ship-cond-30'
  if (cond >= 20) return 'poi-ship-cond-20'
  return 'poi-ship-cond-0'
}

const ShipView: React.FC<{ child: Ship | null }> = ({ child: ship }) => {
  if (!(ship && ship.id > 0)) return <div />
  const raw = ship.raw as RawFleetShip | null
  const mst = getStore(['const', '$ships', String(ship.id)]) || {}
  const data = {
    ...mst,
    ...(raw ?? {}),
  }

  if (!data.api_maxeq) data.api_maxeq = []
  if (!data.api_onslot) data.api_onslot = data.api_maxeq

  return (
    <div className="ship-view" style={{ display: 'flex' }}>
      <div style={{ flex: '0 0 40%' }}>
        <div className="ship-name">
          <span>{getShipName(data)}</span>
          <span className="position-indicator">{`(${ship.id})`}</span>
        </div>
        <div className="ship-info" style={{ display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <span>Lv.</span>
            <span>{data.api_lv || '-'}</span>
          </div>
          <div style={{ flex: 1 }}>
            <span>Cond.</span>
            <span className={getCondClass(data.api_cond)}>
              {_.isInteger(data.api_cond) ? data.api_cond : '-'}
            </span>
          </div>
        </div>
        <div className="ship-fa" style={{ display: 'flex' }}>
          <div style={{ flex: 1 }}><FABar icon={1} max={data.api_fuel_max} now={data.api_fuel} /></div>
          <div style={{ flex: 1 }}><FABar icon={2} max={data.api_bull_max} now={data.api_bull} /></div>
        </div>
        <div className="ship-hp">
          <HPBar max={ship.maxHP} from={ship.initHP} to={ship.nowHP} damage={ship.lostHP} item={ship.useItem ?? undefined} />
        </div>
      </div>
      <div style={{ flex: '0 0 60%' }}>
        {((data.poi_slot || []) as Array<RawSlotItem | null>).map((item, i: number) => (
          <ItemView
            key={i} item={item} extra={false}
            label={data.api_onslot[i] ?? undefined}
            warn={data.api_onslot[i] !== data.api_maxeq[i]}
          />
        ))}
        <ItemView item={data.poi_slot_ex} extra={true} label="+" warn={false} />
      </div>
    </div>
  )
}

const LBACView: React.FC<{ child: RawLBAC }> = ({ child: corps }) => {
  if (!corps?.api_plane_info) return <div />
  return (
    <div className="lbac-view" style={{ display: 'flex' }}>
      <div style={{ flex: '0 0 40%' }}>
        <div className="lbac-name">
          <span>{corps.api_name}</span>
          <span className="position-indicator">{`(No.${corps.api_rid})`}</span>
        </div>
      </div>
      <div style={{ flex: '0 0 60%' }}>
        {(corps.api_plane_info as PoiAirBasePlane[]).map((plane, i: number) => (
          <ItemView
            key={i} item={plane.poi_slot} extra={false}
            label={plane.api_count}
            warn={plane.api_count !== plane.api_max_count}
          />
        ))}
      </div>
    </div>
  )
}

interface ItemViewProps {
  item: RawSlotItem | null | undefined
  extra: boolean
  label: number | string | undefined
  warn: boolean
}

const ItemView: React.FC<ItemViewProps> = ({ item, extra, label, warn }) => {
  if (!item) return <div />
  const raw = item
  const mst = getStore(['const', '$equips', String(item.api_slotitem_id)]) || {}
  const data = {
    ...mst,
    ...raw,
  }

  const apiType3: number | undefined = data.api_type?.[3]
  return (
    <div className="item-view">
      <div className="item-info">
        <span className="item-icon">
          <SlotitemIcon slotitemId={apiType3 ?? 0} />
          {(label != null && (extra || (apiType3 != null && equipIsAircraft(apiType3)))) ? (
            <span className={`number ${warn ? 'text-warning' : ''}`}>{label}</span>
          ) : null}
        </span>
        <span className="item-name">{`${getShipName(data)}`}</span>
      </div>
      <div className="item-attr">
        <span className="alv">
          {data.api_alv > 0
            ? <img src={`file://${ROOT}/assets/img/airplane/alv${data.api_alv}.png`} alt="" />
            : ''}
        </span>
        <span className="level">{data.api_level > 0 ? `★${data.api_level}` : ''}</span>
      </div>
    </div>
  )
}

export default OverviewArea
