const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OAuth = require("oauth").OAuth;
const redis = require('redis');

const redisClient = redis.createClient();

redisClient.on_connect('error', error => console.log(error));

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
    let hashtagQuery = encodeURIComponent(req.query.q);
    const redisKey = `hashtags:${hashtagQuery}`;
    console.log(redisKey);
    const query = `?max_id=${req.query.max_id}&since_id=${req.query.min_id}&q=${hashtagQuery}&include_entities=1&count=100`;

    /* 
        check if redisKey exists
        if it exists, return it
        if not exists, check S3
        if not in S3, fetch it, then
        store it in both cache and S3
    */

    return redisClient.get(redisKey, (error, result) => {
        if (error) console.log(error);
        if (result) {
            const tweetAnalysis = JSON.parse(result);
            console.log(tweetAnalysis);
            let tweetAnalysisFromCache = tweetAnalysis;
            if (amount_of_tweets > tweetAnalysisFromCache.amount_of_tweets) {
                let amount = amount_of_tweets - tweetAnalysisFromCache.amount_of_tweets;
                getTweets(query, amount, null, tweets => {
                    let tweetAnalysisFromAPI = analyseTweets(tweets);

                    tweetAnalysisFromCache.amount_of_tweets += tweetAnalysisFromAPI.amount_of_tweets;
                    tweetAnalysisFromCache.most_important_words.push(...tweetAnalysisFromAPI.most_important_words);
                    tweetAnalysisFromCache.sentimentAnalysis_per_tweet.push(...tweetAnalysisFromAPI.sentimentAnalysis_per_tweet);
                    tweetAnalysisFromCache.hashtagCount.push(...tweetAnalysisFromAPI.hashtagCount);

                    redisClient.setex(redisKey, 3600, JSON.stringify(tweetAnalysisFromCache));

                    return res.send({ source: "Redis cache and Twitter API", tweetAnalysisFromCache });
                })
            } else {
                return res.send({ source: "Redis cache", tweetAnalysis});
            }
        } else {
            getTweets(query, amount_of_tweets, null, tweets => {
                let tweetAnalysis = analyseTweets(tweets);
                redisClient.setex(redisKey, 3600, JSON.stringify(tweetAnalysis));
                res.status(200).send({ source: "Twitter API", tweetAnalysis });
        
            });
        }
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

          if (data === [] || data === undefined) {
              getTweets(query, amount_of_tweets, null, callback);
          }
  
          let tweets = JSON.parse(data);

  
          let parsed_tweets = utils.parseTweets(tweets);
          if (old_data !== null) {
              parsed_tweets.statuses = old_data.statuses.concat(parsed_tweets.statuses);
          }

          let total = parsed_tweets.statuses.length;
          console.log(total);

          let difference = Math.abs(amount_of_tweets - total);

          if (total < amount_of_tweets) {
            let count = difference > 100 ? 100 : difference;

            let min_id = parsed_tweets.search_metadata.min_id;
            let max_id = parsed_tweets.search_metadata.maximum_id;

            let old_query = parsed_tweets.search_metadata.query;

            let new_query = `?max_id=${max_id}&since_id=${min_id}&q=${old_query}&include_entities=1&count=${count}`;

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