// Types extracted from D:\repos\poi (used for window globals and module declarations)
// Note: no top-level import/export so this file stays a "script" and all declarations are global.

/** FCD map data – route maps edge ID to [fromNode | null, toNode], spots maps node ID to [x, y, type] */
interface FcdMapData {
  route: Record<string, [string | null, string]>
  spots: Record<string, [number, number, string]>
}
type FcdMapState = Record<string, FcdMapData>
interface FcdState {
  version: Record<string, string>
  map?: FcdMapState
  shipavatar?: unknown
  shiptag?: unknown
}

/** Minimal subset of poi's RootState used by this plugin */
interface RootState {
  const: Record<string, unknown>
  info: Record<string, unknown>
  config: Record<string, unknown>
  fcd: FcdState
  ext: Record<string, unknown>
  sortie: Record<string, unknown>
  timers: Record<string, unknown>
  battle: Record<string, unknown>
  misc: Record<string, unknown>
  plugins: Record<string, unknown>
  layout: Record<string, unknown>
  ui: Record<string, unknown>
  wctf: Record<string, unknown>
}

/** Subset of poi's IPC class interface */
interface IPC {
  access<T = any>(scope: string): T
  register(scope: string, obj: Record<string, unknown>): void
  unregister(scope: string, keys: string | string[]): void
  unregisterAll(scope: string): void
}

interface Window {
  ROOT: string
  APPDATA_PATH: string
  ipc: IPC
  i18n: Record<string, { __: (key: string, ...args: any[]) => string }>
  getStore(): RootState
  getStore(path: string | string[]): any
  _slotitems: Record<number, any>
  showBattleWithTimestamp?: ((timestamp: number, callback?: (msg: string | null) => void) => void) | null
  isVibrant?: boolean
  POI_VERSION: string
  AppData?: unknown
  getExt?: () => import('../views/store/ext-root').ExtState
}

declare module 'path-extra' {
  const pathExtra: {
    join(...paths: string[]): string
    resolve(...paths: string[]): string
    dirname(p: string): string
    basename(p: string, ext?: string): string
    extname(p: string): string
    isAbsolute(p: string): boolean
    normalize(p: string): string
    relative(from: string, to: string): string
    sep: string
    delimiter: string
    homedir(): string
    [key: string]: any
  }
  export = pathExtra
}

declare module 'views/create-store' {
  // store.dispatch accepts thunks via redux-thunk middleware at runtime
  export const store: {
    dispatch: (...args: any[]) => any
    getState: () => RootState
    subscribe: import('redux').Store<RootState>['subscribe']
  }
  export function getStore(): RootState
  export function getStore(path: string | string[]): any
  export const dispatch: (...args: any[]) => any
}

declare module 'views/utils/selectors' {
  import { Selector } from 'reselect'
  export const configSelector: Selector<RootState, Record<string, unknown>>
  export const extensionSelectorFactory: (id: string) => Selector<RootState, Record<string, unknown>>
  export const fcdSelector: Selector<RootState, FcdState>
}

declare module 'views/utils/game-utils' {
  export const equipIsAircraft: (type: import('kcsapi/api_start2/getData/response').APIMstSlotitem) => boolean
}

declare module 'views/components/etc/icon' {
  import { ComponentType } from 'react'
  export const MaterialIcon: ComponentType<any>
  export const SlotitemIcon: ComponentType<any>
}

declare module 'views/components/etc/avatar' {
  import { ComponentType } from 'react'
  export const Avatar: ComponentType<any>
}

declare module 'views/components/etc/overlay' {
  export { Tooltip, Popover, Dialog, DialogBody, DialogFooter } from '@blueprintjs/core'
}

declare module 'react-fontawesome' {
  import { ComponentType } from 'react'
  const FontAwesome: ComponentType<{ name: string; style?: React.CSSProperties; [key: string]: any }>
  export default FontAwesome
}

declare module 'subtender' {
  export const modifyObject: (key: string, fn: (val: any) => any) => (obj: any) => any
  export const unionSorted: (comparator: (a: any, b: any) => number) => (a: any[], b: any[]) => any[]
  export const mergeMapStateToProps: (...mappers: any[]) => (state: any) => any
}

declare module 'subtender/kc' {
  export const splitMapId: (mapId: number) => { area: number; num: number }
  export const mapIdToStr: (mapId: number) => string
}

