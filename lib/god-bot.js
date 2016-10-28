'use-strict';

import util from 'util';
import path from 'path';
import fs from 'fs';

import FireBase from 'firebase';

import SlackBots from 'slackbots';

const app = FireBase.initializeApp({
    apiKey: "AIzaSyAMhZzxbZ3gC8KInGA-xcTjNjiURJqRwfM",
    authDomain: "god-slack-bot.firebaseapp.com",
    databaseURL: "https://god-slack-bot.firebaseio.com",
    storageBucket: "god-slack-bot.appspot.com",
    messagingSenderId: "925162011673"
});

class GodBot extends SlackBots {
    constructor () {
        super();

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
        this._loadBotUser();
        this._connectDb();
        this._firstRunCheck();
    }

    _connectDb = function () {
        if (!fs.existsSync(this.dbPath)) {
            console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
            process.exit(1);
        }

        this.db = new SQLite.Database(this.dbPath);
    };


    _firstRunCheck = function () {
        let self = this;
        self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function (err, record) {
            if (err) {
                return console.error('DATABASE ERROR:', err);
            }

            var currentTime = (new Date()).toJSON();

            // this is a first run
            if (!record) {
                self._welcomeMessage();
                return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
            }

            // updates with new last running time
            self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
        });
    }

    _getChannelById (channelId) {
        return this.channels.filter(function (item) {
            return item.id === channelId;
        })[0];
    }
}

module.exports = GodBot;