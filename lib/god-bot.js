'use-strict';

import util from 'util';
import path from 'path';
import fs from 'fs';

import Firebase from 'firebase';

import SlackBots from 'slackbots';



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

    _onMessage () {

    }
}

module.exports = GodBot;