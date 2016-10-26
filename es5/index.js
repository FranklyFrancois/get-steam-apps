'use strict';

var _getSteamApps = require('./getSteamApps');

var _getSteamApps2 = _interopRequireDefault(_getSteamApps);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _getSteamApps2.default)().then(function () {
    console.log('finished');
}).catch(function (e) {
    console.log(e);
});