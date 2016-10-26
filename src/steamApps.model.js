'use strict';
import mongoose from 'mongoose';

var steamAppsSchema = new mongoose.Schema({
    appid : Number,
    isEarlyAccess : { type : Boolean, default: false },
    name : String,
    developer : [String],
    publisher : [String],
    genres : [{ id : String , description : String}],
    categories : [{ id : String , description : String}]
});

export default mongoose.model('steamApps', steamAppsSchema);



