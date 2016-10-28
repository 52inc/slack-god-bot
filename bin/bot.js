#!/usr/bin/env node

'use strict';

/**
 * NorrisBot launcher script.
 *
 * @author Luciano Mammino <lucianomammino@gmail.com>
 */

import GodBot from '../lib/god-bot';

/**
 * Environment variables used to configure the bot:
 *
 *  BOT_API_KEY : the authentication token to allow the bot to connect to your slack organization. You can get your
 *      token at the following url: https://<yourorganization>.slack.com/services/new/bot (Mandatory)
 *  BOT_DB_PATH: the path of the SQLite database used by the bot
 *  BOT_NAME: the username you want to give to the bot within your organisation.
 */
let token = process.env.BOT_API_KEY || require('../token');
// let dbPath = process.env.BOT_DB_PATH;
let name = process.env.BOT_NAME;

let godBot = new GodBot({
    token: token,
    // dbPath: dbPath,
    name: name
});

godBot.run();