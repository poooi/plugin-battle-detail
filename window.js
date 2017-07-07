'use strict'

window.remote = require('electron').remote
window.POI_VERSION = remote.getGlobal('POI_VERSION')
window.ROOT = remote.getGlobal('ROOT')
window.MODULE_PATH = remote.getGlobal('MODULE_PATH')
window.APPDATA_PATH = remote.getGlobal('APPDATA_PATH')
require('module').globalPaths.push(MODULE_PATH)
require('module').globalPaths.push(ROOT)

require('module').globalPaths.push(__dirname)  // Import module from root.


// DEBUG
;(() => {
  // var w = remote.getCurrentWindow()
  // w.show()
  // w.openDevTools({detach: true})
})()


// Init environment
// require('babel-register')
// require('coffee-react/register')
require(`${ROOT}/views/env`)


// i18n
const path = require('path-extra')
const i18n = require('i18n-2')
window.i18n = {}

window.i18n.main = new i18n({
  locales: ['en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
  defaultLocale: 'zh-CN',
  directory: path.join(__dirname, 'assets', 'i18n'),
  extension: '.json',
  updateFiles: false,
  devMode: false,
})
window.i18n.main.setLocale(window.language)
window.__ = window.i18n.main.__.bind(window.i18n.main)

window.i18n.resources = {
  __: str => str,
  translate: (locale, str) => str,
  setLocale: str => {},
}
try {
  require('poi-plugin-translator').pluginDidLoad()
} catch (error) {
  // Do nothing
}
window.__r = window.i18n.resources.__.bind(window.i18n.resources)


// Render
document.title = __('Battle Records')
$('#font-awesome').setAttribute('href', require.resolve('font-awesome/css/font-awesome.css'))

const MainArea = require('./views')
ReactDOM.render(React.createElement(MainArea, null), $('main'))
