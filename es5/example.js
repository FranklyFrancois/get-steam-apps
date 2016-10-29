'use strict';

var _ = require('.');

var _2 = _interopRequireDefault(_);

var _SteamAppsModel = require('./SteamApps.model.js');

var _SteamAppsModel2 = _interopRequireDefault(_SteamAppsModel);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_mongoose2.default.Promise = _bluebird2.default;
_mongoose2.default.connect('mongodb://localhost/steamapps_db');

var steamLibrary = new _2.default(_SteamAppsModel2.default);

steamLibrary.getApps().then(function () {
    console.log('finished');
}).catch(function (e) {
    console.log(e);
});