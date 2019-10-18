const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OAuth = require("oauth").OAuth;
dotenv.config();

const app = express();

app.use(express.static(__dirname + "/src/public")).use(cors());

const consumer_key = process.env.CONSUMER_KEY; // Add your API key here
const consumer_secret = process.env.CONSUMER_SECRET; // Add your API secret key here
const access_token = process.env.ACCESS_TOKEN;
const access_secret = process.env.ACCESS_SECRET;

oa = new OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  consumer_key,
  consumer_secret,
  "1.0",
  "",
  "HMAC-SHA1"
);

/* 
send request data in the function
or declare it globally?

data is first null
if data === null 
get tweets

send tweets to function
append new tweets to tweets
send tweets




*/

let getTweets = async (query, amount_of_tweets = 500, data = null, callback) => {
    let old_data = data;
    try {
        //make this a recursive function to move the client-side logic to server-side.
        //not send the tweets in response, but the most common words and NLP processing/analysis?
      oa.get(
        `https://api.twitter.com/1.1/search/tweets.json${query}`,
        access_token,
        access_secret,
        (error, data, response) => {
          if (error) {
            console.log(error);
          }
  
          let tweets = JSON.parse(data);
  
          let parsed_tweets = parse(tweets);
          if (old_data !== null) {
              parsed_tweets.statuses = old_data.statuses.concat(parsed_tweets.statuses);
          }

          let total = parsed_tweets.statuses.length;
          console.log(total);
          if (total < amount_of_tweets) {
            let min_id = parsed_tweets.search_metadata.min_id;
            let max_id = parsed_tweets.search_metadata.maximum_id;
            let old_query = parsed_tweets.search_metadata.query;

            let new_query = `?max_id=${max_id}&since_id=${min_id}&q=${old_query}&include_entities=1&count=100`;

            getTweets(new_query, amount_of_tweets, parsed_tweets, callback);
          } else {
            callback(parsed_tweets);
          }
        });
    } catch (e) {
      console.log(e);
    }
}

let count = 0;
app.get("/get/tweets", async (req, res) => {
    let amount_of_tweets = req.query.amount;
    query = `?max_id=${req.query.max_id}&since_id=${req.query.min_id}&q=${encodeURIComponent(req.query.q)}&include_entities=1&count=100`;

    console.log(`${count++}: ${req.hostname}: ${query}`);

    getTweets(query, amount_of_tweets, null, function (tweets) {
        res.send(tweets);
    });

});


//needs refactoring
function parse(data) {
  /*   tweet.created_at
  tweet.text
  tweet.user.name
  tweet.user.screen_name
  tweet.entities
  tweet.lang */

  if (data === undefined || data.statuses === undefined) {
    return { error: "no tweets available" };
  }
  let new_tweets = [];
  tweets = data.statuses;
  let max_id = tweets[0].id;
  let min_id = tweets[0].id;
  for (let i = 0; i < data.statuses.length; i++) {
    let id = tweets[i].id;
    if (id < min_id) {
      min_id = id;
    }
    if (id > max_id) {
      max_id = id;
    }
    let full_text = "";
    let text = tweets[i].text;
    let entities = tweets[i].entities.hashtags;
    let retweet = false;
    const properties = Object.getOwnPropertyNames(tweets[i]);
    if (properties.includes("retweeted_status")) {
      retweet = true;
      const retweet_status = Object.getOwnPropertyNames(
        tweets[i].retweeted_status
      );
      if (retweet_status.includes("extended_tweet")) {
        full_text = tweets[i].retweeted_status.extended_tweet.full_text;
        entities = tweets[i].retweeted_status.extended_tweet.entities.hashtags;
      }
    }
    let new_tweet = {
      text: tweets[i].text,
      username: tweets[i].user.name,
      screen_name: tweets[i].user.screen_name,
      created_at: tweets[i].created_at,
      hashtags: entities,
      language: tweets[i].lang,
      retweet: retweet,
      retweet_text: retweet ? full_text : text
    };

    if (entities.length > 0) {
      new_tweets.push(new_tweet);
    }
  }
  data.statuses = new_tweets;
  data.search_metadata["min_id"] = min_id;
  data.search_metadata["maximum_id"] = max_id - 1;

  return data;
}

console.log("listening on port 8080");
app.listen(8080);
