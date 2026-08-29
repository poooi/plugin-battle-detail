import * as remote from '@electron/remote'

const { getStore } = window
const { __: __r } = window.i18n.resources

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getShipName(ship: number | any): string | null {
  if (Number.isInteger(ship)) {
    ship = getStore(['const', '$ships', ship])
  }
  if (ship == null) return null
  let name: string = __r(ship.api_name)
  const yomi = ship.api_yomi
  if (['elite', 'flagship'].includes(yomi)) {
    name += yomi
  }
  return name
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getItemName(item: number | any): string | null {
  if (Number.isInteger(item)) {
    item = getStore(['const', '$equips', item])
  }
  if (item == null) return null
  return __r(item.api_name)
}

export async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms > 0 ? ms : 0)
  })
}

export function loadScript(src: string, targetDocument: Document = document): void {
  const script = targetDocument.createElement('script')
  script.setAttribute('src', src)
  targetDocument.head.appendChild(script)
}

// clipboard
type ClipboardService = typeof import('views/services/clipboard')

const getClipboardService = (): ClipboardService | null => {
  try {
    return require('views/services/clipboard') as ClipboardService
  } catch {
    return null
  }
}

export const writeClipboardText = async (v: string): Promise<void> => {
  const clipboardService = getClipboardService()
  if (clipboardService) {
    if (!(await clipboardService.writeClipboardText(v)))
      throw new Error('Failed to write text to clipboard.')
  } else {
    remote.clipboard.writeText(v)
  }
}

export const readClipboardText = async (): Promise<string> => {
  if (Number.parseInt(process.versions.electron, 10) >= 44) {
    return navigator.clipboard.readText()
  } else {
    return remote.clipboard.readText()
  }
}
