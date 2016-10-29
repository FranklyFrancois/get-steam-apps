'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GetSteamApps = function () {
    function GetSteamApps(model) {
        var _this = this;

        _classCallCheck(this, GetSteamApps);

        this._model = model;
        this._concurrent = 0;
        this._throttle = function () {
            _this._concurrent++;
            if (_this._concurrent > 3) {
                _this._concurrent = 0;
                //adjust this value to maximize performance
                console.log('throttling for 3 seconds');
                return 3000;
            } else {
                return 500;
            }
        };
        this._createNewSteamApp = function (app) {
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
                    return _this._model.create(newApp);
                }
            } else {
                //just skip the current steam app if there's an error
                //retry next time you run the script. 
                return _bluebird2.default.resolve();
            }
        };
        this._getAppDetails = function (id) {
            return (0, _requestPromise2.default)('http://store.steampowered.com/api/appdetails?appids=' + id);
        };
    }

    _createClass(GetSteamApps, [{
        key: 'getApps',
        value: function getApps() {
            var _this2 = this;

            return this._model.distinct('appid').exec().then(function (apps) {
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
                                return _this2._getAppDetails(app.appid).then(function (res) {
                                    var newApp = void 0;
                                    try {
                                        newApp = JSON.parse(res)[app.appid];
                                        newApp.data.appid = app.appid;
                                    } catch (error) {
                                        //just skip the current steam app if there's an error with the request ( geo-restriction, malformed response)
                                        console.log('skipping appid:' + app.appid + ' - ' + (index + 1) + ' of ' + length);
                                        return resolve();
                                    }
                                    return _this2._createNewSteamApp(newApp).then(function () {
                                        console.log('Created appid:' + app.appid + ' - ' + (index + 1) + ' of ' + length);
                                        resolve();
                                    });
                                });
                                //throttling requests 
                            }, _this2._throttle());
                        });
                    }, _bluebird2.default.resolve());
                });
            });
        }

        //temporary throttling function, so steam doesn't spit back garbage data after being hammered too hard, it works since reduce is sequential

    }]);

    return GetSteamApps;
}();

exports.default = GetSteamApps;