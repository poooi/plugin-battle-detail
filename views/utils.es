
const { getStore } = window
const { __: __r } = window.i18n.resources

export function getShipName(ship) {
  if (Number.isInteger(ship)) {
    ship = getStore(['const', '$ships', ship])
  }
  if (ship == null) {
    return null
  }
  let name = __r(ship.api_name)
  let yomi = ship.api_yomi
  if (['elite', 'flagship'].includes(yomi)) {
    name += yomi
  }
  return name
}

export function getItemName(item) {
  if (Number.isInteger(item)) {
    item = getStore(['const', '$equips', item])
  }
  if (item == null) {
    return null
  }
  let name = __r(item.api_name)
  return name
}

export async function sleep(ms) {
  await new Promise((resolve, _reject) => {
    setTimeout(() => resolve(), ms > 0 ? ms : 0)
  })
}

export function loadScript(path, targetDocument = document) {
  const script = targetDocument.createElement('script')
  script.setAttribute('src', path)
  targetDocument.head.appendChild(script)
}
