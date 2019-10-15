const express = require('express');
const cors = require('cors');
const request = require('request');
const util = require('util');
const dotenv = require('dotenv');
dotenv.config();


const app = express();

app.use(express.static(__dirname + '/src/public'))
    .use(cors());



const get = util.promisify(request.get);
const post = util.promisify(request.post);

const consumer_key = process.env.CONSUMER_KEY; // Add your API key here
const consumer_secret = process.env.CONSUMER_SECRET // Add your API secret key here
console.log(consumer_key);
console.log(consumer_secret);

const bearerTokenURL = new URL('https://api.twitter.com/oauth2/token');
const streamURL = new URL('https://api.twitter.com/labs/1/tweets/stream/filter?format=detailed');
const rulesURL = new URL('https://api.twitter.com/labs/1/tweets/stream/filter/rules');

async function bearerToken (auth) {
  const requestConfig = {
    url: bearerTokenURL,
    auth: {
      user: consumer_key,
      pass: consumer_secret,
    },
    form: {
      grant_type: 'client_credentials',
    },
  };

  const response = await post(requestConfig);
  return JSON.parse(response.body).access_token;
}

async function getAllRules(token) {
  let response;
  const requestConfig = {
    url: rulesURL,
    auth: {
      bearer: token
    }
  };

  try {
    response = await post(requestConfig);
  } catch(e) {
    console.log(e);
  }

  return JSON.parse(response.body);
}

async function deleteAllRules(rules, token) {
  let response;
  if (!Array.isArray(rules.data)) {
    return null;
  }

  const ids = rules.data.map(rule => rule.id);

  const requestConfig = {
    url: rulesURL,
    auth: {
      bearer: token
    },
    json: {
      delete: {
        ids: ids
      }
    }
  };

  try {
    response = await post(requestConfig);
  } catch(e) {
    console.log(e);
  }

  return response.body;
}

async function setRules(rules, token) {
  let response;
  const requestConfig = {
    url: rulesURL,
    auth: {
      bearer: token
    },
    json: {
      add: rules  
    }
  };

  try {
    response = await post(requestConfig);
  } catch(e) {
    console.log(e);
  }

  return response.body;
}

function streamConnect(token) {
  // Listen to the stream
  const config = {
    url: 'https://api.twitter.com/labs/1/tweets/stream/filter?format=compact',
    auth: {
      bearer: token,
    },
    timeout: 20000,
  };

  const stream = request.get(config);

  stream.on('data', data => {
    const tweet = JSON.parse(data);
    console.log("-----------------------------------");
    console.log(tweet.data.text);
    console.log("-----------------------------------");
      
  }).on('error', error => {
    if (error.code === 'ETIMEDOUT') {
      stream.emit('timeout');
    }
  });

  return stream;
}

app.get('/stream', async (req, res) => {
  const hashtags = req.query.hashtags;
  let rules = [];
  for (let i = 0; i < hashtags.length; i++) {
    let hashtag = hashtags[i];
    let rule = {'value': `${hashtag}`, 'tag': `${hashtag}`};
    rules.push(rule);
  }
  let token, currentRules;

  try {
    // Exchange your credentials for a Bearer token
    token = await bearerToken({consumer_key, consumer_secret});
  } catch (e) {
    console.error(`Could not generate a Bearer token. Please check that your credentials are correct and that the Filtered Stream preview is enabled in your Labs dashboard. (${e})`);
    process.exit(-1);
  }
  currentRules = await getAllRules(token);
  await deleteAllRules(currentRules, token);
  await setRules(rules, token);
  
  const config = {
    url: streamURL,
    auth: {
      bearer: token,
    },
    timeout: 20000,
  };
  const stream = request.get(config);
  let timeout = 0;

  stream.on('data', data => {
    const f = data.toString();
    try {
      const in_json = JSON.parse(data);
      const tweet = in_json.toString();
      console.log(in_json);
      res.write(f);
      //res.write(in_json);
    } catch (e) {
      console.log(e);
    }
    //console.log("-----------------------------------");
    //console.log(tweet);
    console.log("-----------------------------------");
      
  }).on('error', error => {
    if (error.code === 'ETIMEDOUT') {
      stream.emit('timeout');
    }
  }).on('timeout', () => {
    // Reconnect on error
    console.warn('A connection error occurred. Reconnecting…');
    setTimeout(() => {
      timeout++;
      streamConnect(token);
    }, 2 ** timeout);
    streamConnect(token);
  });
})

//(async () => {
//  let token, currentRules;
//  const rules = [
//    { 'value': '#hongkong has:hashtags', 'tag': 'hongkong hashtag' },
//  ];
//
//  try {
//    // Exchange your credentials for a Bearer token
//    token = await bearerToken({consumer_key, consumer_secret});
//  } catch (e) {
//    console.error(`Could not generate a Bearer token. Please check that your credentials are correct and that the Filtered Stream preview is enabled in your Labs dashboard. (${e})`);
//    process.exit(-1);
//  }
//
//  try {
//    // Gets the complete list of rules currently applied to the stream
//    currentRules = await getAllRules(token);
//    
//    // Delete all rules. Comment this line if you want to keep your existing rules.
//    //await deleteAllRules(currentRules, token);
//
//    // Add rules to the stream. Comment this line if you want to keep your existing rules.
//    //await setRules(rules, token);
//  } catch (e) {
//    console.error(e);
//    process.exit(-1);
//  }
//
//  // Listen to the stream.
//  // This reconnection logic will attempt to reconnect when a disconnection is detected.
//  // To avoid rate limites, this logic implements exponential backoff, so the wait time
//  // will increase if the client cannot reconnect to the stream.
//
//  const stream = streamConnect(token);
//  let timeout = 0;
//  stream.on('timeout', () => {
//    // Reconnect on error
//    console.warn('A connection error occurred. Reconnecting…');
//    setTimeout(() => {
//      timeout++;
//      streamConnect(token);
//    }, 2 ** timeout);
//    streamConnect(token);
//  });
//})();


console.log('listening on port 8080');
app.listen(8080);
