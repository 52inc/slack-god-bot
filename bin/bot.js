#!/usr/bin/env node

'use strict';

import GodBot from '../lib/god-bot';

let token = process.env.BOT_API_KEY || require('../token');
// let dbPath = process.env.BOT_DB_PATH;
let name = process.env.BOT_NAME;

let godBot = new GodBot({
    token: token,
    // dbPath: dbPath,
    name: name
});

godBot.run();