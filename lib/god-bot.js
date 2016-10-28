/*
 * God Bot
 *
*/

'use-strict';

import util from 'util';
import path from 'path';
import fs from 'fs';

import FireBase from 'firebase';
import SlackBot from 'slackbots';


/*
 * Firebase config
*/

const config = {
    apiKey: "AIzaSyBwaBJFgiY9Eyv87GF5QBtpHvNRxJ-mZPw",
    authDomain: "slack-god-bot.firebaseapp.com",
    databaseURL: "https://slack-god-bot.firebaseio.com",
    storageBucket: "slack-god-bot.appspot.com",
    messagingSenderId: "1053348192014"
};


/*
 * Utility
*/

let isLoud = (message) => {
    return message !== message.toLowerCase() && message === message.toUpperCase();
};


/*
 * Bot Class
*/

class GodBot extends SlackBot {
    constructor (settings) {
        super(settings);

        this.settings = settings;
        this.settings.name = this.settings.name || 'godbot';
        //this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'norrisbot.db');

        this.user = null;
        this.db = null;
    }

    run () {
        this.on('start', this._onStart);
        this.on('message', this._onMessage);
    }

    _onStart () {
        this._connectDb();
    }

    _connectDb () {
        console.log("Firebase initializing...");
        this.db = FireBase.initializeApp(config);
        this.db.$set({start: {time: new Date()}});
    }
}

module.exports = GodBot;
