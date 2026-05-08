import React from 'react'
import { MaterialIcon, SlotitemIcon } from 'views/components/etc/icon'

const { getStore } = window

interface FABarProps {
  max: number
  now: number
  icon: number
}

export const FABar: React.FC<FABarProps> = ({ max, now, icon }) => {
  let pcnt = Math.floor(100 * now / max)
  if (!(max && now)) {
    pcnt = 100
  }
  return (
    <span className="fa-bar">
      <MaterialIcon materialId={icon} />
      {`${pcnt}%`}
    </span>
  )
}

type HpStyle = 'danger' | 'warning' | 'info' | 'success'

const getHpStyle = (percent: number): HpStyle => {
  if (percent <= 25) return 'danger'
  if (percent <= 50) return 'warning'
  if (percent <= 75) return 'info'
  return 'success'
}

interface HPBarProps {
  max: number
  from: number
  to: number
  damage: number
  item?: number
}

export const HPBar: React.FC<HPBarProps> = ({ max, from, to, damage, item }) => {
  let safeFrom = from < 0 ? 0 : from > max ? max : from
  let safeTo = to < 0 ? 0 : to > max ? max : to

  const now = 100 * safeTo / max
  const lost = 100 * (safeFrom - safeTo) / max
  const style = getHpStyle(now)

  const additions: React.ReactNode[] = []
  if (damage !== 0) {
    additions.push(`${-damage}`)
  }

  const $slotitems = getStore(['const', '$equips']) || {}
  if (item && $slotitems[item]) {
    const itemIcon = $slotitems[item].api_type[3]
    additions.push(<SlotitemIcon key="icon" slotitemId={itemIcon} />)
  }

  const labels: React.ReactNode[] = []
  labels.push(<span key={-1}>{`${safeTo} / ${max}`}</span>)
  if (additions.length > 0) {
    labels.push(<span key={-2}>{' ('}</span>)
    additions.forEach((addition, i) => {
      labels.push(<span key={i * 2}>{addition}</span>)
      labels.push(<span key={i * 2 + 1}>{', '}</span>)
    })
    labels.pop()
    labels.push(<span key={-3}>{')'}</span>)
  }

  return (
    <div className="hp-bar">
      <div
        className={`hp-bar-fill hp-${style}`}
        style={{ width: `${now}%`, position: 'relative' }}
      >
        <span className="hp-label">{labels}</span>
      </div>
      <div className="hp-bar-lost" style={{ width: `${lost}%` }} />
    </div>
  )
}
