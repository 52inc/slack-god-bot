/*
 * God Bot
 *
*/

'use-strict';

// Node
const util = require('util');
const path = require('path');
const fs = require('fs');

// Dependencies
const giphy = require('giphy-api')();
const FireBase = require('firebase');
const SlackBot = require('slackbots');


/*
 * Firebase Config
*/

const config = {
    apiKey: 'AIzaSyBwaBJFgiY9Eyv87GF5QBtpHvNRxJ-mZPw',
    authDomain: 'slack-god-bot.firebaseapp.com',
    databaseURL: 'https://slack-god-bot.firebaseio.com',
    storageBucket: 'slack-god-bot.appspot.com',
    messagingSenderId: '1053348192014'
};

let database = FireBase.initializeApp(config).database();


/*
 * Firebase Calls
*/

let getUserList = () => {
    let userList = false;

    database
        .ref('users/')
        .once('value')
        .then((snapshot) => {
            userList = snapshot.val();
        });

    return userList;
};

let getUserRank = (user) => {
    let userRank = false;

    database
        .ref(`users/${user.id}`)
        .once('value')
        .then((snapshot) => {
            userRank = snapshot.val().rank;
        });

    return userRank;
};

let setUserRank = (user, rank) => {
    let userRank = false;

    database
        .ref(`users/${user.id}`)
        .set({
            'name': user.name,
            'rank': rank
        }).then(() => {

        });

    return userRank;
};


/*
 * Bot Responses
*/

const botResponses = {
    conversation: {
        greeting: [
            "Hello {name}, that's a nice rank you have there. It'd be a shame if anything were to happen to it."
        ]
    },
    rank: [
        "{}"
    ]
};

const giphyLinks = [
    'god'
];


/*
 * Utility
*/

let isLoud = (message) => {
    return message !== message.toLowerCase() && message === message.toUpperCase();
};


let randomIndex = (list) => {
    let randomNumber = Math.floor(Math.random() * list.length);
    return list[randomNumber];
};



/*
 * Bot Class
*/

class GodBot extends SlackBot {
    constructor (settings) {
        super(settings);

        this.settings = settings;

        this.name = this.settings.name || 'godbot';

        this.db = null;
        this.user = null;
        this.users = null;

        this.usersTimeoutQueue = [];
    }

    run () {
        this.on('start', this._onStart);
        this.on('message', this._onMessage);
        this.on('open', this._onOpen);
        this.on('close', this._onClose);
        this.on('error', this._onError);
    }

    //////////////////////

    /*
     * Slack Action Listeners
    */

    _onStart () {
        this._loadBotUser();
        this._connectDb();
    }

    _onMessage (message) {
        this._checkMessageType(message);
    }

    _onOpen () {
        console.log('open');
    }

    _onClose () {
        console.log('close');
    }

    _onError () {
        console.log('error');
    }


    /*
     * Message Checkers
    */

    _checkMessageType (message) {
        let isChatMessage = this._isChatMessage(message);
        let isChannelConversation = this._isChannelConversation(message);
        let isFromBot = this._isFromBot(message);

        if (isChatMessage && isChannelConversation && !isFromBot) {
            this._reply(message);
        }
    }


    /*
     * Actions
    */

    _reply (message) {
        let self = this;

        let user = this._getUserById(message.user);
        let channel = this._getChannelById(message.channel);

        let isMentioningBot = this._isMentioningBot(message);
        let isRankMessage = this._isRankMessage(message);
        let isLeaderboardMessage = this._isLeaderboardMessage(message);

        this._postGiphy(channel);


        return;

        if (isMentioningBot && isLeaderboardMessage) {
            this._postLeaderboard(channel);
        }

        if (!isMentioningBot && isRankMessage) {
            this._rank(message, user, (rank) => {
                this._postRank(channel, user, rank);
            });
        }

        if (isMentioningBot && !isRankMessage) {
            this._postResponse(channel, message, user);
        }


        if (message.hasOwnProperty('rank')) {
            console.log('Reply:', 'Rank');
        }
    }


    /*
     * Post
    */

    _post (channel, message, params = {as_user: true}) {
      this.postMessageToChannel(channel.name, message, params);
    }

    _postLeaderboard (channel) {
        let userList = getUserList();

        let leaderBoardMessage = 'Leader Board: \n';

        for (let user in users) {
            if (users.hasOwnProperty(user)) {
                leaderBoardMessage = leaderBoardMessage + `@${users[user].name}: ${users[user].rank} \n`;
            }
        }

        self.postMessageToChannel(channel.name, leaderBoardMessage, {as_user: true});
    }

    _postResponse (channel, message, user) {
        let self = this;

        self.postMessageToChannel(
            channel.name,
            this._userBasedResponse(user.name),
            {as_user: true}
        );
    }

    _postRank (channel) {
        let self = this;

        self.postMessageToChannel(
            channel.name,
            this.userBasedResponse(user.name),
            {as_user: true}
        );
    }

    _postGiphy (channel) {
        let self = this;
        let post = (giphy) => {
          self.postMessageToChannel(
              channel.name,
              giphy.url,
              {as_user: true}
          );
        };

        this._randomGiphyLink(post);
    }


    /*
     * Utility
    */

    _randomGiphyLink (callback) {
        giphy.search({
            q: randomIndex(giphyLinks),
            limit: '5',
            rating: 'g'
        }).then((res) => {
            callback(randomIndex(res.data));
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

    _userBasedResponse (userName) {
        let message = '';

        switch (userName) {
            case 'ulmentflam':
                message = 'Bless you.';
                break;
            case 'zach':
                message = 'My boy!';
                break;
            default:
                message = `How are you today ${userName}?`;
        }

        return message;
    }


    /*
     * Ranking
    */

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



    /*
     * Message Type Identifier
    */

    _isChatMessage (message) {
        return message.type === 'message' && Boolean(message.text);
    }

    _isChannelConversation (message) {
        return typeof message.channel === 'string' && message.channel[0] === 'C';
    }

    _isFromBot (message) {
        return message.user === this.user.id;
    }

    _isMentioningBot (message) {
        return message.text.indexOf(`<@${this.user.id}>`) > -1;
    }

    _isRankMessage (message) {
        return message.text.indexOf('++') || message.text.indexOf('--');
    }

    _isLeaderboardMessage (message) {
        return /@god leaderboard/i.test(message.text);
    }


    /*
     * Slack Response Filter
    */

    _getChannelById (channelId) {
        return this.channels.filter((channel) => channel.id === channelId)[0];
    }

    _getUserById (userId) {
        return this.users.filter((user) => user.id === userId)[0];
    }


    /*
     * Runtime
    */

    _loadBotUser () {
        let self = this;
        this.user = this.users.filter((user) => user.name === self.name)[0];
    }

    _loadUserList () {
        this.users = getUserList();
    }

    _connectDb () {
        console.log('Firebase initializing...');

        this.database = database;
    }
}

module.exports = GodBot;
