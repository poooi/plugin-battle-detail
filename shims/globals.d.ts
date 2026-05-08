interface Window {
  ROOT: string
  APPDATA_PATH: string
  ipc: {
    access: (key: string) => any
    register: (key: string, obj: any) => void
    unregister: (key: string, prop: string) => void
    unregisterAll: (key: string) => void
  }
  i18n: Record<string, { __: (key: string, ...args: any[]) => string }>
  getStore: (path?: string | string[]) => any
  _slotitems: Record<number, any>
  showBattleWithTimestamp?: ((timestamp: number, callback?: (msg: string | null) => void) => void) | null
  isVibrant?: boolean
  POI_VERSION: string
  AppData?: any
}

declare module 'views/create-store' {
  export const store: any
}

declare module 'views/utils/selectors' {
  import { Selector } from 'reselect'
  export const configSelector: Selector<any, any>
  export const extensionSelectorFactory: (id: string) => Selector<any, any>
  export const fcdSelector: Selector<any, any>
}

declare module 'views/utils/game-utils' {
  export const equipIsAircraft: (type: number) => boolean
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

declare module 'path-extra' {
  import _path from 'path'
  const path: typeof _path
  export = path
}
