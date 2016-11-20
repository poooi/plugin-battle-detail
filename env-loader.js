window.remote = require('electron').remote;

window.POI_VERSION = remote.getGlobal('POI_VERSION');

window.ROOT = remote.getGlobal('ROOT');
window.MODULE_PATH = remote.getGlobal('MODULE_PATH');
window.APPDATA_PATH = remote.getGlobal('APPDATA_PATH');

require('module').globalPaths.push(MODULE_PATH);
require('module').globalPaths.push(ROOT);

require('babel-register')
require('coffee-react/register')

;(() => {
  // var w = remote.getCurrentWindow()
  // w.show()
  // w.openDevTools({detach: true})
})()