remote = require 'remote'
windowManager = remote.require './lib/window'
{FontAwesome} = window

i18n = require 'i18n'
{join} = require 'path-extra'
i18n.configure
  locales: ['en-US', 'ja-JP', 'zh-CN', 'zh-TW']
  defaultLocale: 'zh-CN'
  directory: join(__dirname, 'assets', 'i18n')
  updateFiles: false
  indent: '\t'
  extension: '.json'
i18n.setLocale config.get 'poi.language', navigator.language
__ = i18n.__

window.battleDetailWindow = null
initialWindow = ->
  window.battleDetailWindow = windowManager.createWindow
    x: config.get 'poi.window.x', 0
    y: config.get 'poi.window.y', 0
    width: 820
    height: 650
  window.battleDetailWindow.loadUrl "file://#{__dirname}/views.html"
  if process.env.DEBUG?
    window.battleDetailWindow.openDevTools
      detach: true
if config.get('plugin.BattleDetail.enable', true)
  initialWindow()

module.exports =
  name: 'BattleDetail'
  priority: 11
  displayName: <span><FontAwesome name='info' fixedWidth={true} />{' ' + __('Battle Detail')}</span>
  author: 'Dazzy Ding'
  link: 'https://github.com/yukixz'
  version: '1.0.0'
  description: __ ""
  handleClick: ->
    window.battleDetailWindow.show()
