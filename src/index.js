'use strict'
import Promise from 'bluebird';
import request from 'request-promise';

class GetSteamApps {
    constructor(model) {
        this._model = model;
        this._concurrent = 0;
        this._throttle = () => {
            this._concurrent++;
            if (this._concurrent > 3) {
                this._concurrent = 0;
                //adjust this value to maximize performance
                console.log('throttling for 3 seconds');
                return 3000;
            } else {
                return 500;
            }
        }
        this._createNewSteamApp = (app) => {
            let newApp = (typeof app.data !== "undefined") ? app.data : null;
            if (newApp !== null) {
                //handle any manipulation here like grabbing screenshots from the app object
                try {
                    for (let genre of newApp.genres) {
                        if (genre.id == "70") {
                            newApp.isEarlyAccess = true;
                            break;
                        }
                    }
                }
                finally {
                    return this._model.create(newApp);
                }
            } else {
                //just skip the current steam app if there's an error
                //retry next time you run the script. 
                return Promise.resolve();
            }
        }
        this._getAppDetails = (id) => {
            return request(`http://store.steampowered.com/api/appdetails?appids=${id}`)
        }

    }

    getApps() {
        return this._model.distinct('appid').exec().then(apps => {
            let existingApps = apps;
            return request('http://api.steampowered.com/ISteamApps/GetAppList/v2')
                .then(res => {
                    console.log('comparing existing library with new library');
                    let parsedResponse = JSON.parse(res).applist.apps;
                    //check for existing apps 
                    let newSteamApps = parsedResponse.filter((item) => {
                        //compare apps with parsedReponse 
                        return existingApps.indexOf(item.appid) < 0;
                    });
                    return Promise.reduce(newSteamApps, (total, app, index, length) => {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                return this._getAppDetails(app.appid).then((res) => {
                                    let newApp;
                                    try {
                                        newApp = JSON.parse(res)[app.appid];
                                        newApp.data.appid = app.appid;
                                    }
                                    catch (error) {
                                        //just skip the current steam app if there's an error with the request ( geo-restriction, malformed response)
                                        console.log(`skipping appid:${app.appid} - ${index + 1} of ${length}`);
                                        return resolve();
                                    }
                                    return this._createNewSteamApp(newApp).then(() => {
                                        console.log(`Created appid:${app.appid} - ${index + 1} of ${length}`);
                                        resolve();
                                    });
                                })
                                //temporary throttling function, so steam doesn't spit back garbage data after being hammered too hard, it works since reduce is sequential
                            }, this._throttle())
                        });
                    }, Promise.resolve());

                });
        })
    }

   
}

export default GetSteamApps;
