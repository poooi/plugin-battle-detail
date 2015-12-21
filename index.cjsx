remote = require 'remote'
windowManager = remote.require './lib/window'
{FontAwesome} = window

path = require 'path-extra'
window.i18n.battleInfo = new(require 'i18n')
  locales: ['en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
  defaultLocale: 'zh-CN',
  directory: path.join(__dirname, 'assets', 'i18n'),
  updateFiles: false,
  indent: '\t',
  extension: '.json'
window.i18n.battleInfo.setLocale(window.language)
__ = window.i18n.battleInfo.__.bind(window.i18n.battleInfo)

window.battleDetailWindow = null
initialWindow = ->
  window.battleDetailWindow = windowManager.createWindow
    x: config.get 'poi.window.x', 0
    y: config.get 'poi.window.y', 0
    width: 850
    height: 650
  window.battleDetailWindow.loadURL "file://#{__dirname}/battle-detail.html"
  if process.env.DEBUG?
    window.battleDetailWindow.openDevTools
      detach: true
if config.get('plugin.BattleDetail.enable', true)
  initialWindow()

module.exports =
  name: 'BattleDetail'
  priority: 11
  displayName: <span><FontAwesome name='info-circle' /> {__('Battle Detail')}</span>
  author: 'Dazzy Ding'
  link: 'https://github.com/yukixz'
  version: '1.3.1'
  description: __ "Show battle detail"
  handleClick: ->
    window.battleDetailWindow.show()
