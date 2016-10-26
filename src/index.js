import getSteamApps from './getSteamApps';

getSteamApps()
    .then(() => {
        console.log('finished'); 
    })
    .catch(e => {
        console.log(e);
    })