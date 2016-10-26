'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = getSteamApps;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _steamAppsModel = require('./steamApps.model.js');

var _steamAppsModel2 = _interopRequireDefault(_steamAppsModel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_mongoose2.default.Promise = _bluebird2.default;
_mongoose2.default.connect('mongodb://localhost/steamapps_db');

var concurrent = 0;

function getSteamApps() {
    return _steamAppsModel2.default.distinct('appid').exec().then(function (apps) {
        var existingApps = apps;
        return (0, _requestPromise2.default)('http://api.steampowered.com/ISteamApps/GetAppList/v2').then(function (res) {
            console.log('comparing existing library with new library');
            var parsedResponse = JSON.parse(res).applist.apps;
            //check for existing apps 
            var newSteamApps = parsedResponse.filter(function (item) {
                //compare apps with parsedReponse 
                return existingApps.indexOf(item.appid) < 0;
            });
            return _bluebird2.default.reduce(newSteamApps, function (total, app, index, length) {
                return new _bluebird2.default(function (resolve, reject) {
                    setTimeout(function () {
                        return getAppDetails(app.appid).then(function (res) {
                            var newApp = void 0;
                            try {
                                newApp = JSON.parse(res)[app.appid];
                                newApp.data.appid = app.appid;
                            } catch (error) {
                                //just skip the current steam app if there's an error with the request ( geo-restriction, malformed response)
                                console.log('skipping appid:' + app.appid + ' - ' + (index + 1) + ' of ' + length);
                                return resolve();
                            }
                            return createNewSteamApp(newApp).then(function () {
                                console.log('Created appid:' + app.appid + ' - ' + (index + 1) + ' of ' + length);
                                resolve();
                            });
                        });
                        //throttling requests 
                    }, throttle());
                });
            }, _bluebird2.default.resolve());
        });
    });
}

//temporary throttling function, so steam doesn't spit back garbage data after being hammered too hard, it works since reduce is sequential
function throttle() {
    concurrent++;
    if (concurrent > 3) {
        concurrent = 0;
        //adjust this value to maximize performance
        console.log('throttling for 3 seconds');
        return 3000;
    } else {
        return 500;
    }
}

function createNewSteamApp(app) {

    var newApp = typeof app.data !== "undefined" ? app.data : null;
    if (newApp !== null) {
        //handle any manipulation here like grabbing screenshots from the app object
        try {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = newApp.genres[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var genre = _step.value;

                    if (genre.id == "70") {
                        newApp.isEarlyAccess = true;
                        break;
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        } finally {
            return _steamAppsModel2.default.create(newApp);
        }
    } else {
        //just skip the current steam app if there's an error
        //retry next time you run the script. 
        return _bluebird2.default.resolve();
    }
}

function getAppDetails(id) {
    return (0, _requestPromise2.default)('http://store.steampowered.com/api/appdetails?appids=' + id);
}