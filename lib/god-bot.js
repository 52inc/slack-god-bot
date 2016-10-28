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

        this.usersRankCapped = [];
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
        let isRanking = this._isRanking(message);
        let isChatMessage = this._isChatMessage(message);
        let isChannelConversation = this._isChannelConversation(message);
        let isFromBot = this._isFromBot(message);
        let isMentioningBot =  this._isMentioningBot(message);

        if (typeof isRanking === 'object' && isChatMessage && isChannelConversation && !isFromBot) {
            this._reply(message, isRanking);
        } else if (isChatMessage && isChannelConversation && !isFromBot && isMentioningBot) {
            this._reply(message);
        }
    }

    _isRanking (message) {
        // console.log(message);
        if (typeof message.text === 'undefined') {
            return false;
        }

        let rankedUsers = false;

        if (message.text.indexOf('<@U') > -1 &&
            (message.text.indexOf('++') > -1 ||
            message.text.indexOf('--') > -1)) {
            rankedUsers = this.users.filter((user) => message.text.indexOf(user.id) > -1);
        }

        if (rankedUsers) {
            rankedUsers.forEach((user) => {
                if (message.text.indexOf(`<@${user.id}>++`) > -1 || message.text.indexOf(`<@${user.id}> ++`) > -1) {
                    user["rankChange"] = 1;
                } else if (message.text.indexOf(`<@${user.id}>--`) > -1 || message.text.indexOf(`<@${user.id}> --`) > -1 ) {
                    user["rankChange"] = -1;
                }
            });
        }

        return rankedUsers;
    }

    _isChatMessage (message) {
        return message.type === 'message' && Boolean(message.text);
    }

    _isChannelConversation (message) {
        // what?
        return typeof message.channel === 'string' && message.channel[0] === 'C';
    }

    _isFromBot (message) {
        return message.user === this.user.id;
    }

    _isMentioningBot (message) {
        if (!message.hasOwnProperty('text')) {
            return false;
        }

        return message.text.indexOf(`<@${this.user.id}>`) > -1;
    }

    _reply (message, isRanking = false) {
        let self = this;
        let channel = this._getChannelById(message.channel);
        let triggerUser = this._getUserById(message.user);
        let botMessage = `Hello, ${triggerUser.name}`;
        let rankBasedMessage = false;
        // console.log(isRanking.length > 1 );
        console.log(isRanking);

        if (message.text.indexOf('leaderboard') > -1) {
            this._leaderBoard((users) => {
                let leaderBoardMessage = 'Leader Board: \n';

                for (let user in users) {
                    if (users.hasOwnProperty(user)) {
                        leaderBoardMessage = leaderBoardMessage + `@${users[user].name}: ${users[user].rank} \n`;
                    }
                }

                self.postMessageToChannel(channel.name, leaderBoardMessage, {as_user: true});
            });
        } else if (isRanking && typeof isRanking === 'object') {
            if (this.usersRankCapped.indexOf(message.user) > -1) {
                return false;
            }

            isRanking.forEach((user) => {
                this._rank(user, message, (rank) => {
                    botMessage = `${this._randomRankStatement(user.name, rank)}`;
                    self.postMessageToChannel(channel.name, this._rankBasedMessage(rank), {as_user: true});
                    self.postMessageToChannel(channel.name, botMessage, {as_user: true});
                });
            });

            this.usersRankCapped.push(message.user);


            setTimeout(() => {
                this.usersRankCapped.splice(this.usersRankCapped.indexOf(message.user), 1);
                console.log(this.usersRankCapped);
            }, 6 * 10000);
        } else {
            switch (triggerUser.name) {
                case 'zach':
                        botMessage = 'yooooooooo';
                    break;
                case 'ulmentflam':
                        botMessage = 'bless you';
                    break;
                default:

            }

            self.postMessageToChannel(channel.name, botMessage, {as_user: true});
        }
    }

    _rankBasedMessage (rank) {
        let message = false;

        switch (true) {
            case (rank >= 10):
                message = 'Super cool, bro.';
                break;
            case (rank < 0):
            // console.log('oaky');
                message = 'Your ranking is very low. May I have mercy on your soul.';
                break;
            default:
                message = 'Awesome.';
        }

        return message;
    }

    _rank (user, message, callback) {
        if (typeof message.text === 'undefined') {
            return false;
        }

        let targetUser = user;
        let triggerUser = this._getUserById(message.user);
        let rankChange = user.rankChange || 0;
        // let currentRank = this._getUserRank(user.id);

        return this._setUserRank(user, rankChange, callback);
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

    // _getUserRank (user) {
    //     let userRank = false;
    //
    //     if (user.hasOwnProperty('rank')) {
    //         userRank = new Promise((resolve, reject) => {
    //         this.db
    //             .ref(`users/${user.id}`)
    //             .once('value')
    //             .then((snapshot) => {
    //                 resolve(snapshot.val().rank);
    //             });
    //         });
    //     }
    //
    //     return userRank;
    // }
    _leaderBoard (callback) {
        this.db
            .ref(`users/`)
            .once('value')
            .then((snapshot) => {
                let users = false;

                if (snapshot.val() !== null) {
                    users = snapshot.val();
                    callback(users);
                }
            });
    }

    _getUserRank (user) {
        return new Promise((resolve) => {
            this.db
                .ref(`users/${user.id}`)
                .once('value')
                .then((snapshot) => {
                    let rank = false;

                    if (snapshot.val() !== null) {
                        rank = snapshot.val().rank;
                    }

                    resolve(rank);
                });
        });
    }

    _randomRankStatement (name, rank) {
        let statements = [
            `@${name}, you're now at ${rank}`,
            `Well look at you, @${name}. ${rank}? Psshhh`,
            `@${name}, can you feel the ${rank}?!?`,
            `rank: ${rank}, name: @${name}`
        ];

        return statements[Math.floor(Math.random() * statements.length)];
    }

    _setUserRank (user, rankChange, callback) {
        this._getUserRank(user).then((rank) => {
            let userRank = null;

            if (rank) {
                userRank = rank + rankChange;
            } else {
                userRank = rankChange;
            }

            this.db.ref(`users/${user.id}`).set({
                'name': user.name,
                'rank': userRank
            }).then(() => {
                callback(userRank);
            });
        }, console.log);
    }

    _connectDb () {
        console.log('Firebase initializing...');

        this.db = FireBase.database();
    }
}

module.exports = GodBot;
