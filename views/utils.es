
const {__r} = window

export function getShipName(ship) {
  if (Number.isInteger(ship)) {
    ship = window.$ships[ship]
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
  console.log(0, item)
  if (Number.isInteger(item)) {
    item = window.$slotitems[item]
  }
  console.log(1, item)
  if (item == null) {
    return null
  }
  let name = __r(item.api_name)
  console.log(2, name)
  return name
}

export async function sleep(ms) {
  await new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms > 0 ? ms : 0)
  })
}
