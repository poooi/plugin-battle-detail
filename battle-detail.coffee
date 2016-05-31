require "#{ROOT}/views/env"
path = require 'path-extra'

# i18n
window.i18n = {}

window.i18n.main = new(require 'i18n-2')
  locales: ['en-US', 'ja-JP', 'zh-CN', 'zh-TW']
  defaultLocale: 'zh-CN'
  directory: path.join(__dirname, 'assets', 'i18n')
  extension: '.json'
  updateFiles: false
  devMode: false
window.i18n.main.setLocale(window.language)
window.__ = window.i18n.main.__.bind(window.i18n.main)

try
  require('poi-plugin-translator').pluginDidLoad()
catch error
  console.log error
window.i18n.resources ?= {}
window.i18n.resources.__ ?= (str) -> return str
window.i18n.resources.translate ?= (locale, str) -> return str
window.i18n.resources.setLocale ?= (str) -> return
window.__r = window.i18n.resources.__.bind(window.i18n.resources)

# Render
document.title = __ 'Battle Detail'
$('#font-awesome')?.setAttribute 'href', require.resolve('font-awesome/css/font-awesome.css')
require './views'

# Debug
#w = remote.getCurrentWindow()
#w.show()
#w.openDevTools({detach: true})
