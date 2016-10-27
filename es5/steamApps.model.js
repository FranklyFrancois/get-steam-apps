'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var steamAppsSchema = new _mongoose2.default.Schema({
    appid: Number,
    isEarlyAccess: { type: Boolean, default: false },
    name: String,
    developer: [String],
    publisher: [String],
    genres: [{ id: String, description: String }],
    categories: [{ id: String, description: String }],
    builds: [{ buildid: Number, description: String, timeupdated: Number, category: { type: String, enum: ['public', 'development', 'legacy'] } }]
});

exports.default = _mongoose2.default.model('steamApps', steamAppsSchema);