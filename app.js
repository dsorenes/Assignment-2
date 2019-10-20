const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OAuth = require("oauth").OAuth;

const analyseTweets = require('./analyseTweets.js');
const utils = require('./utils.js');

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

let count = 0;

app.get("/get/tweets", async (req, res) => {
    let amount_of_tweets = req.query.amount;

    const query = `?max_id=${req.query.max_id}&since_id=${req.query.min_id}&q=${encodeURIComponent(req.query.q)}&include_entities=1&count=100`;

    console.log(`${count++}: ${req.hostname}: ${query}`);

    //might be able to not need amount of tweets in function.
    //maybe another API endpoint with streaming/not streaming
    //if streaming we get_tweets, if not streaming we send tweets
    getTweets(query, amount_of_tweets, null, tweets => {
        let tweetAnalysis = analyseTweets(tweets);
        res.send(tweetAnalysis);

    });

});

let getTweets = async (query, amount_of_tweets = 500, data = null, callback) => {
    let old_data = data;

    try {
      oa.get(
        `https://api.twitter.com/1.1/search/tweets.json${query}&lang=en`,
        access_token,
        access_secret,
        (error, data, response) => {
          if (error) {
            console.log(error);
          }
  
          let tweets = JSON.parse(data);
  
          let parsed_tweets = utils.parseTweets(tweets);
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

console.log("listening on port 8080");
app.listen(8080);