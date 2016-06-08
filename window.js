'use strict';

require(`${ROOT}/views/env`);

// i18n
const path = require('path-extra');
const i18n = require('i18n-2');
window.i18n = {};

window.i18n.main = new i18n({
  locales: ['en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
  defaultLocale: 'zh-CN',
  directory: path.join(__dirname, 'assets', 'i18n'),
  extension: '.json',
  updateFiles: false,
  devMode: false
});
window.i18n.main.setLocale(window.language);
window.__ = window.i18n.main.__.bind(window.i18n.main);

window.i18n.resources = {
  __: str => str,
  translate: (locale, str) => str,
  setLocale: str => {}
};
try {
  require('poi-plugin-translator').pluginDidLoad();
} catch (error) {
  console.log(error);
}
window.__r = window.i18n.resources.__.bind(window.i18n.resources);

// Render
document.title = __('Battle Detail');
$('#font-awesome').setAttribute('href', require.resolve('font-awesome/css/font-awesome.css'));

const MainArea = require('./views');
ReactDOM.render(React.createElement(MainArea, null), $('main'));
