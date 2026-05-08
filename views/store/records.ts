import _ from 'lodash'
import { createSelector } from 'reselect'
import path from 'path-extra'
import { readJsonSync } from 'fs-extra'
import { splitMapId } from 'subtender/kc'
import { fcdSelector } from 'views/utils/selectors'

const fcdMapP1Raw = readJsonSync(
  path.join(__dirname, '..', '..', 'assets', 'data', 'fcd-map-p1.json')
)

const p1Cutoff = Number(new Date('2018-08-17T00:00:00+09:00'))

export interface ParsedEffMapId {
  effMapId: string
  phase: 1 | 2
}

export interface ParsedMapId {
  mapId: number
  phase: number
  mapArea: number
  mapNo: number
}

const BATTLE_MAP_PATTERN = /^(\d+)-(\d+)$/

export const parseBattleMapAndTime = (
  battleMapStr: string,
  timestamp: number
): ParsedEffMapId | null => {
  if (typeof battleMapStr !== 'string') {
    console.warn(`battle.map is expected to be a string, but got ${typeof battleMapStr}`)
    return null
  }
  const phase: 1 | 2 = timestamp > p1Cutoff ? 2 : 1
  if (battleMapStr === '') {
    return { effMapId: 'pvp', phase }
  }

  const matchResult = BATTLE_MAP_PATTERN.exec(battleMapStr)
  if (matchResult === null) {
    console.warn(`unexpected content of battle.map: ${battleMapStr}`)
    return null
  }
  const [, worldRaw, areaRaw] = matchResult
  return { effMapId: `${worldRaw}${areaRaw}p${phase}`, phase }
}

export const parseEffMapId = _.memoize((eMapId: string): ParsedMapId | 'pvp' | null => {
  if (eMapId === 'pvp') return 'pvp'
  const matchResult = /^(\d+)p(1|2)$/.exec(eMapId)
  if (!matchResult) {
    console.error(`parse error: ${eMapId} is not a valid EffMapId`)
    return null
  }
  const [, mapIdStr, phaseStr] = matchResult
  const mapId = Number(mapIdStr)
  const phase = Number(phaseStr)
  const { area: mapArea, num: mapNo } = splitMapId(mapId)
  return { mapId, phase, mapArea, mapNo }
})

type EffMapIdFn = (f: (...args: any[]) => any) => any

export const withEffMapId = (eMapId: string): EffMapIdFn => {
  const result = parseEffMapId(eMapId)
  if (result !== null && typeof result === 'object') {
    const { mapId, phase } = result
    return (f: (mapId: number, phase: number) => any) => f(mapId, phase)
  } else {
    return (f: (result: string | null) => any) => f(result as any)
  }
}

export const getFcdMapInfoFuncSelector = createSelector(
  fcdSelector,
  (fcd: any) => (effMapId: string) =>
    withEffMapId(effMapId)((mapId: any, phase: any) => {
      if (mapId === null || mapId === 'pvp') return null
      const num = mapId % 10
      const world = Math.round((mapId - num) / 10)
      const fcdMapId = `${world}-${num}`

      if (phase === 1) return _.get(fcdMapP1Raw, ['data', fcdMapId], null)
      if (phase === 2) return _.get(fcd, ['map', fcdMapId], null)

      console.warn(`fcd lookup failed, unexpected phase: ${phase}`)
      return null
    })
)
