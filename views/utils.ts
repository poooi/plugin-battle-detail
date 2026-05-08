const { getStore } = window
const { __: __r } = window.i18n.resources

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

export function getItemName(item: number | any): string | null {
  if (Number.isInteger(item)) {
    item = getStore(['const', '$equips', item])
  }
  if (item == null) return null
  return __r(item.api_name) as string
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
