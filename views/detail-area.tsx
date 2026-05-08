import FontAwesome from 'react-fontawesome'
import { get } from 'lodash'
import React, { Fragment } from 'react'
import { Card } from '@blueprintjs/core'
import { Tooltip } from 'views/components/etc/overlay'
import cls from 'classnames'

const { __ } = window.i18n['poi-plugin-battle-detail']

import { HPBar } from './bar'
import { getShipName, getItemName } from './utils'

import {
  StageType, AttackType, HitType, ShipOwner,
  AirControl, Engagement, Formation, Detection,
} from '../lib/battle'

const AirControlName: Record<string, string> = {
  [AirControl.Parity]: __('Air Parity'),
  [AirControl.Supremacy]: __('Air Supremacy'),
  [AirControl.Superiority]: __('Air Superiority'),
  [AirControl.Denial]: __('Air Denial'),
  [AirControl.Incapability]: __('Air Incapability'),
}

const EngagementName: Record<string, string> = {
  [Engagement.Parallel]: __('Parallel Engagement'),
  [Engagement.Headon]: __('Head-on Engagement'),
  [Engagement.TAdvantage]: __('Crossing the T (Advantage)'),
  [Engagement.TDisadvantage]: __('Crossing the T (Disadvantage)'),
}

const FormationName: Record<string, string> = {
  [Formation.Ahead]: __('Line Ahead'),
  [Formation.Double]: __('Double Line'),
  [Formation.Diamond]: __('Diamond'),
  [Formation.Echelon]: __('Echelon'),
  [Formation.Abreast]: __('Line Abreast'),
  [Formation.Vanguard]: __('Vanguard'),
  [Formation.CruisingAntiSub]: __('Cruising Formation 1 (anti-sub)'),
  [Formation.CruisingForward]: __('Cruising Formation 2 (forward)'),
  [Formation.CruisingDiamond]: __('Cruising Formation 3 (ring)'),
  [Formation.CruisingBattle]: __('Cruising Formation 4 (battle)'),
}

const DetectionName: Record<string, string> = {
  [Detection.Success]: __('Detection Success'),
  [Detection.SuccessNR]: `${__('Detection Success')} (${__('not return')})`,
  [Detection.SuccessNP]: `${__('Detection Success')} (${__('without plane')})`,
  [Detection.Failure]: __('Detection Failure'),
  [Detection.FailureNR]: `${__('Detection Failure')} (${__('not return')})`,
  [Detection.FailureNP]: `${__('Detection Failure')} (${__('without plane')})`,
}

const AttackTypeName: Record<string, string> = {
  [AttackType.Normal]: __('AT_Normal'),
  [AttackType.Laser]: __('AT_Laser'),
  [AttackType.Double]: __('AT_Double'),
  [AttackType.Nelson_Touch]: __('AT_Nelson_Touch'),
  [AttackType.Nagato_Punch]: __('AT_Nagato_Punch'),
  [AttackType.Mutsu_Splash]: __('AT_Mutsu_Splash'),
  [AttackType.Colorado_Fire]: __('AT_Colorado_Fire'),
  [AttackType.Kongo_Class_Kaini_C_Charge]: __('AT_Kongo_Class_Kaini_C_Charge'),
  [AttackType.Yamato_Attack_Double]: __('AT_Yamato_Attack_Double'),
  [AttackType.Yamato_Attack_Triple]: __('AT_Yamato_Attack_Triple'),
  [AttackType.Baguette_Charge]: __('AT_Baguette_Charge'),
  [AttackType.QE_Touch]: __('AT_QE_Touch'),
  [AttackType.Zuiun_Night_Attack]: __('AT_Zuiun_Night_Attack'),
  [AttackType.Type_4_LC_Special_Attack]: __('AT_Type_4_LC_Special_Attack'),
  [AttackType.Submarine_Special_Attack_2_3]: __('AT_Submarine_Special_Attack'),
  [AttackType.Submarine_Special_Attack_3_4]: __('AT_Submarine_Special_Attack'),
  [AttackType.Submarine_Special_Attack_2_4]: __('AT_Submarine_Special_Attack'),
  [AttackType.Carrier_CI]: __('AT_Carrier_CI'),
  [AttackType.Primary_Secondary_CI]: __('AT_Primary_Secondary_CI'),
  [AttackType.Primary_Radar_CI]: __('AT_Primary_Radar_CI'),
  [AttackType.Primary_AP_CI]: __('AT_Primary_AP_CI'),
  [AttackType.Primary_Primary_CI]: __('AT_Primary_Primary_CI'),
  [AttackType.Primary_Torpedo_CI]: __('AT_Primary_Torpedo_CI'),
  [AttackType.Torpedo_Torpedo_CI]: __('AT_Torpedo_Torpedo_CI'),
}

const EngagementTable: React.FC<{ engagement: any }> = ({ engagement: e }) => {
  const rows: React.ReactNode[] = []

  if (e.engagement || e.fFormation || e.eFormation)
    rows.push(
      <div className="engagement-row" key={1}>
        <span>{FormationName[e.fFormation]}</span>
        <span>{EngagementName[e.engagement]}</span>
        <span>{FormationName[e.eFormation]}</span>
      </div>
    )

  if (e.fDetection || e.eDetection)
    rows.push(
      <div className="engagement-row" key={2}>
        <span>{DetectionName[e.fDetection]}</span>
        <span />
        <span>{DetectionName[e.eDetection]}</span>
      </div>
    )

  if (e.smokeType)
    rows.push(
      <div className="engagement-row" key={3}>
        <span /><span>{`${__('Smoke')}: ${e.smokeType}`}</span><span />
      </div>
    )

  if (e.weakened)
    rows.push(
      <div className="engagement-row" key={4}>
        <span /><span>{`${__('Gimmick')}: ${e.weakened}`}</span><span />
      </div>
    )

  if (e.fContact || e.eContact)
    rows.push(
      <div className="engagement-row" key={5}>
        <span>{e.fContact ? `${__('Contact')}: ${getItemName(e.fContact)}` : ''}</span>
        <span />
        <span>{e.eContact ? `${__('Contact')}: ${getItemName(e.eContact)}` : ''}</span>
      </div>
    )

  if (e.fFlare || e.eFlare)
    rows.push(
      <div className="engagement-row" key={6}>
        <span>{e.fFlare ? `${__('Star Shell')}: ${getShipName(get(e, 'fFlare.id'))}` : ''}</span>
        <span />
        <span>{e.eFlare ? `${__('Star Shell')}: ${getShipName(get(e, 'eFlare.id'))}` : ''}</span>
      </div>
    )

  return <div className="engagement-table">{rows}</div>
}

const PlaneCount: React.FC<{ init?: number; now?: number }> = ({ init, now }) =>
  init == null ? <span /> : (
    <span>
      <FontAwesome name="plane" />{init}
      <FontAwesome name="long-arrow-right" />{now}
    </span>
  )

const AntiAirCICell: React.FC<{ aerial: any }> = ({ aerial }) => {
  const { aaciKind, aaciShip, aaciItems } = aerial
  if (aaciKind == null) return <span />

  const tooltipContent = (
    <div className="anti-air-tooltip">
      <div>{__('Anti-air Kind')}: {aaciKind}</div>
      {aaciItems.map((id: number, i: number) => <div key={i}>{getItemName(id)}</div>)}
    </div>
  )

  return (
    <Tooltip content={tooltipContent} placement="top">
      <span>{__('Anti-air Cut-in')}: {getShipName(aaciShip.id)} ({aaciKind})</span>
    </Tooltip>
  )
}

const AerialTable: React.FC<{ aerial: any }> = ({ aerial: a }) => {
  if (a == null) return <div />
  return (
    <div className="aerial-table">
      <div className="aerial-row">
        <span><PlaneCount init={a.fPlaneInit1} now={a.fPlaneNow1} /></span>
        <span>{a.fContact ? `${__('Contact')}: ${getItemName(a.fContact)}` : ''}</span>
        <span>{AirControlName[a.control]}</span>
        <span>{a.eContact ? `${__('Contact')}: ${getItemName(a.eContact)}` : ''}</span>
        <span><PlaneCount init={a.ePlaneInit1} now={a.ePlaneNow1} /></span>
      </div>
      <div className="aerial-row">
        <span><PlaneCount init={a.fPlaneInit2} now={a.fPlaneNow2} /></span>
        <span />
        <span><AntiAirCICell aerial={a} /></span>
        <span />
        <span><PlaneCount init={a.ePlaneInit2} now={a.ePlaneNow2} /></span>
      </div>
    </div>
  )
}

const ShipInfo: React.FC<{ ship: any }> = ({ ship }) => {
  if (ship == null) return <span />
  return (
    <span>
      <span>{getShipName(ship.id)}</span>
      <span className="position-indicator">{`(${ship.pos})`}</span>
    </span>
  )
}

const DamageInfo: React.FC<{ type: any; damage: number[]; hit: any[] }> = ({ type, damage, hit }) => (
  <span>
    {AttackTypeName[type]} (
    {damage.map((current, i) => (
      <Fragment key={i}>
        <span className={cls({ critical: hit[i] === HitType.Critical })}>
          {hit[i] === HitType.Miss ? 'miss' : current}
        </span>
        {i !== damage.length - 1 && ','}
      </Fragment>
    ))}
    )
  </span>
)

const AttackRow: React.FC<{ attack: any }> = ({ attack }) => {
  const { type, fromShip, toShip, fromHP, toHP, damage, hit, useItem } = attack
  const { maxHP } = toShip
  const totalDamage = damage.reduce((p: number, x: number) => p + x, 0)
  return toShip.owner !== ShipOwner.Enemy ? (
    <div className="attack-row">
      <span><HPBar max={maxHP} from={fromHP} to={toHP} damage={totalDamage} item={useItem} /></span>
      <span><ShipInfo ship={toShip} /></span>
      <span><FontAwesome name="long-arrow-left" /></span>
      <span><DamageInfo type={type} damage={damage} hit={hit} /></span>
      <span />
      <span><ShipInfo ship={fromShip} /></span>
      <span />
    </div>
  ) : (
    <div className="attack-row">
      <span />
      <span><ShipInfo ship={fromShip} /></span>
      <span />
      <span><DamageInfo type={type} damage={damage} hit={hit} /></span>
      <span><FontAwesome name="long-arrow-right" /></span>
      <span><ShipInfo ship={toShip} /></span>
      <span><HPBar max={maxHP} from={fromHP} to={toHP} damage={totalDamage} item={useItem} /></span>
    </div>
  )
}

const AttackTable: React.FC<{ attacks: any[] }> = ({ attacks }) => {
  if (attacks == null || attacks.length === 0) return <div />
  return (
    <div className="attack-table">
      {attacks.map((attack, i) => <AttackRow key={i} attack={attack} />)}
    </div>
  )
}

const StageTable: React.FC<{ stage: any }> = ({ stage }) => {
  if (stage == null) return <div />

  let title: string | null = null

  switch (stage.type) {
    case StageType.Engagement:
      break
    case StageType.Aerial:
      title = stage.subtype === StageType.Assault
        ? `${__('Aerial Combat')} - ${__('Jet Air Assault')}`
        : __('Aerial Combat')
      break
    case StageType.Torpedo:
      title = stage.subtype === StageType.Opening
        ? __('Opening Torpedo Salvo')
        : __('Torpedo Salvo')
      break
    case StageType.Shelling:
      switch (stage.subtype) {
        case StageType.Main: title = `${__('Shelling')} - ${__('Main Fleet')}`; break
        case StageType.Escort: title = `${__('Shelling')} - ${__('Escort Fleet')}`; break
        case StageType.Night: title = __('Night Combat'); break
        case StageType.Opening: title = __('Opening Anti-Sub'); break
        default: title = __('Shelling')
      }
      break
    case StageType.Support:
      switch (stage.subtype) {
        case StageType.Aerial: title = `${__('Expedition Supporting Fire')} - ${__('Aerial Support')}`; break
        case StageType.Shelling: title = `${__('Expedition Supporting Fire')} - ${__('Shelling Support')}`; break
        case StageType.Torpedo: title = `${__('Expedition Supporting Fire')} - ${__('Torpedo Support')}`; break
      }
      break
    case StageType.LandBase:
      title = stage.subtype === StageType.Assault
        ? `${__('Land Base Air Corps')} - ${__('Jet Air Assault')}`
        : `${__('Land Base Air Corps')} - No.${stage.kouku.api_base_id}`
      break
  }

  return (
    <div className="stage-table">
      <div className="stage-title">{title}</div>
      {stage.engagement != null && <EngagementTable engagement={stage.engagement} />}
      {stage.aerial != null && <AerialTable aerial={stage.aerial} />}
      {stage.attacks != null && <AttackTable attacks={stage.attacks} />}
      <hr />
    </div>
  )
}

interface DetailAreaProps {
  simulator: any
  stages: any[]
}

const DetailArea: React.FC<DetailAreaProps> = ({ simulator, stages }) => {
  const tables = stages != null
    ? stages.map((stage, i) => <StageTable key={i} stage={stage} simulator={simulator} />)
    : []

  return (
    <div id="detail-area">
      <Card>
        <h5 className="bp3-heading">{__('Battle Detail')}</h5>
        <div>
          {tables.length > 0 ? tables : __('No battle')}
        </div>
      </Card>
    </div>
  )
}

export default DetailArea
