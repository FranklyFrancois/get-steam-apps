'use strict'
import Promise from 'bluebird';
import request from 'request-promise';
import mongoose from 'mongoose';
mongoose.Promise = Promise;
mongoose.connect('mongodb://localhost/steamapps_db');
import SteamApps from './steamApps.model.js';
var concurrent = 0;

export default function getSteamApps() {
    return SteamApps.distinct('appid').exec().then(apps => {
        let existingApps = apps;
        return request('http://api.steampowered.com/ISteamApps/GetAppList/v2')
            .then(res => {
                console.log('comparing existing library with new library');
                let parsedResponse = JSON.parse(res).applist.apps;
                //check for existing apps 
                let newSteamApps = parsedResponse.filter(function (item) {
                    //compare apps with parsedReponse 
                    return existingApps.indexOf(item.appid) < 0;
                });
                return Promise.reduce(newSteamApps, function (total, app, index, length) {
                    return new Promise((resolve, reject) => {
                        setTimeout(function () {
                            return getAppDetails(app.appid).then((res) => {
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
                                return createNewSteamApp(newApp).then(() => {
                                    console.log(`Created appid:${app.appid} - ${index + 1} of ${length}`);
                                    resolve();
                                });
                            })
                            //throttling requests 
                        }, throttle())
                    });
                }, Promise.resolve());

            });
    })
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
            return SteamApps.create(newApp);
        }

    } else {
        //just skip the current steam app if there's an error
        //retry next time you run the script. 
        return Promise.resolve();

    }
}

function getAppDetails(id) {
    return request(`http://store.steampowered.com/api/appdetails?appids=${id}`)
}

