/*
 * God Bot
 *
*/

'use-strict';

const util = require('util');
const path = require('path');
const fs = require('fs');

const FireBase = require('firebase');
const SlackBot = require('slackbots');


/*
 * Firebase config
*/

const config = {
    apiKey: 'AIzaSyBwaBJFgiY9Eyv87GF5QBtpHvNRxJ-mZPw',
    authDomain: 'slack-god-bot.firebaseapp.com',
    databaseURL: 'https://slack-god-bot.firebaseio.com',
    storageBucket: 'slack-god-bot.appspot.com',
    messagingSenderId: '1053348192014'
};

FireBase.initializeApp(config);

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
        this.name = this.settings.name || 'god';
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
    }

    _onMessage (message) {
        if (this._isChatMessage(message) &&
            this._isChannelConversation(message) &&
            !this._isFromSelf(message) &&
            this._isMentioningSelf(message)
        ) {
            if (this._isRanking(message)) {
                this._rank(message);
            } else {
                this._reply(message);
            }

        }
    }

    _isRanking (message) {

    }

    _isChatMessage (message) {
        return message.type === 'message' && Boolean(message.text);
    }

    _isChannelConversation (message) {
        // what?
        return typeof message.channel === 'string' && message.channel[0] === 'C';
    }

    _isFromSelf (message) {
        return message.user === this.user.id;
    }

    _isMentioningSelf (message) {
        if (!message.hasOwnProperty('text')) {
            return false;
        }

        return message.text.indexOf(`<@${this.user.id}>`) > -1;
    }

    _reply (message) {
        let self = this;
        let channel = this._getChannelById(message.channel);
        let user = this._getUserById(message.user);
        let botMessage = `Hello, ${user.name}`;

        switch (user.name) {
            case 'zach':
                    botMessage = 'yooooooooo';
                break;
            case 'evan':
                    botMessage = 'bless you';
                break;
            default:

        }

        self.postMessageToChannel(channel.name, botMessage, {as_user: true});
    }

    _getChannelById (channelId) {
        return this.channels.filter((channel) => channel.id === channelId)[0];
    }

    _getUserById (userId) {
        return this.users.filter((user) => user.id === userId)[0];
    }

    _firstRunCheck () {
        let self = this;

    }

    _loadBotUser () {
        let self = this;
        this.user = this.users.filter((user) => user.name === self.name)[0];
    }

    _connectDb () {
        console.log('Firebase initializing...');

        this.db = FireBase.database();
        this.db.ref('time/').set({ dope: true });
    }
}

module.exports = GodBot;
