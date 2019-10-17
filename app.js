const express = require('express');
const cors = require('cors');
const request = require('request');
const util = require('util');
const dotenv = require('dotenv');
const ndjson = require('ndjson');
const OAuth = require("oauth").OAuth;
dotenv.config();

const app = express();


app.use(express.static(__dirname + '/src/public'))
    .use(cors());


const consumer_key = process.env.CONSUMER_KEY; // Add your API key here
const consumer_secret = process.env.CONSUMER_SECRET; // Add your API secret key here
const access_token = process.env.ACCESS_TOKEN;
const access_secret = process.env.ACCESS_SECRET;
let finished = false;

oa = new OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  consumer_key,
  consumer_secret,
  "1.0",
  "",
  "HMAC-SHA1"
);

app.get('/get/tweets/next', async (req, res) => {
  console.log(query);
  res.send(query);
})

app.get('/get/tweets', async (req, res) => {
  let max_id = req.query.max_id !== undefined ? `max_id=${req.query.max_id}` : "";
  let q = req.query.q !== undefined ? `q=${encodeURIComponent(req.query.q).replace(/%20/gi, '+')}` : "";
  let include_entities = req.query.include_entities !== undefined ? `include_entities=${req.query.include_entities}` : "";
  query = `?${max_id}${max_id ? '&' + q : q}${include_entities ? '&' + include_entities : include_entities}&count=100`;
  console.log(query);
  try {
    oa.get(`https://api.twitter.com/1.1/search/tweets.json${query}`, access_token, access_secret, (error, data, response) => {
      if (error) {
        console.log(error);
      }
      console.log(data.length);
      let tweets = JSON.parse(data);
      let parsed_tweets = parse(tweets);
      res.send(parsed_tweets);
    });
  } catch (e) {
    console.log(e);
  }
});

function parse(data) {
/*   tweet.created_at
  tweet.text
  tweet.user.name
  tweet.user.screen_name
  tweet.entities
  tweet.lang */
  let new_tweets = [];
  tweets = data.statuses;
  for (let i = 0; i < data.statuses.length; i++) {
    let full_text = '';
    let text = tweets[i].text;
    let entities = tweets[i].entities.hashtags;
    let retweet = false;
    const properties = Object.getOwnPropertyNames(tweets[i]);
    if (properties.includes('retweeted_status')) {
      retweet = true;
      const retweet_status = Object.getOwnPropertyNames(tweets[i].retweeted_status);
      if (retweet_status.includes('extended_tweet')) {
        full_text = tweets[i].retweeted_status.extended_tweet.full_text;
        entities = tweets[i].retweeted_status.extended_tweet.entities.hashtags;
      }
    }
    let new_tweet = {
      'text': tweets[i].text,
      'username': tweets[i].user.name,
      'screen_name': tweets[i].user.screen_name,
      'created_at': tweets[i].created_at,
      'hashtags': entities,
      'language': tweets[i].lang,
      'retweet': retweet,
      'retweet_text': retweet ? full_text : text
    };

    if (entities.length > 0) {
      new_tweets.push(new_tweet);
    } 

  }
  data.statuses = new_tweets;

  return data;
}

console.log('listening on port 8080');
app.listen(8080);
