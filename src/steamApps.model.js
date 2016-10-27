'use strict';
import mongoose from 'mongoose';

var steamAppsSchema = new mongoose.Schema({
    appid : Number,
    isEarlyAccess : { type : Boolean, default: false },
    name : String,
    developer : [String],
    publisher : [String],
    genres : [{ id : String , description : String}],
    categories : [{ id : String , description : String}],
    builds : [{buildid : Number, description : String, timeupdated : Number, category : { type : String, enum : ['public', 'development', 'legacy'] }}]
});

export default mongoose.model('steamApps', steamAppsSchema);
