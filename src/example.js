import GetSteamApps from '.';
import SteamAppModel from './SteamApps.model.js'; 
import mongoose from 'mongoose'; 
import Promise from 'bluebird'; 

mongoose.Promise = Promise; 
mongoose.connect('mongodb://localhost/steamapps_db');


let steamLibrary = new GetSteamApps(SteamAppModel); 

steamLibrary.getApps()
    .then(() => {
        console.log('finished'); 
    })
    .catch(e => {
        console.log(e);
    })