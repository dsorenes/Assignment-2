const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OAuth = require("oauth").OAuth;
const natural = require('natural');
const nlp = require('compromise');
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
    query = `?max_id=${req.query.max_id}&since_id=${req.query.min_id}&q=${encodeURIComponent(req.query.q)}&include_entities=1&count=100`;

    console.log(`${count++}: ${req.hostname}: ${query}`);

    //might be able to not need amount of tweets in function.
    //maybe another API endpoint with streaming/not streaming
    //if streaming we get_tweets, if not streaming we send tweets
    getTweets(query, amount_of_tweets, null, function (tweets) {
        featureExtraction(tweets, 50);
        res.send(tweets);
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

function tokenize(tweets) {
    const stopwords = require('./stopwords.js');
    let tokenizer = new natural.RegexpTokenizer({pattern: /[!@$%^&*(),.?":{}|<>'(...)]/g});

    let data = tweets.statuses.map(tweet => {
        let normalised = nlp(tweet.text).normalize({
            whitespace: true,
            unicode: true,
            contractions: true,
            acronyms: true,
            possessives: true,
            plurals: true,
            verbs: true

        }).out('text');
        let words = normalised.split(' ');
        words = words.filter(word => stopwords.includes(word) === false
        && word.includes('https') === false
        && word.includes('…') === false
        && word.includes('@') === false).join('.');

        return words;
    });
    data = data.map(tweet => tokenizer.tokenize(tweet));

    return data;
}

function featureExtraction(tweets, amount = 100) {
    let TfIdf = natural.TfIdf;
    let tfidf = new TfIdf();
    
    let words = tokenize(tweets);
    document = words.map(tweet => {
        return tweet.join(' ');
    }).join(' ');

    document = tfidf.addDocument(document);

    for (let i = 0; i < amount; i++) {
        let features = tfidf.listTerms(0);
        
        console.log(features[i].term + ': ' + features[i].tfidf);
    }

}

function parse(data) {
    if (data === undefined || data.statuses === undefined) {
        return { error: "no tweets available" };
    }

    let new_tweets = [];
    let tweets = data.statuses;

    let max_id = tweets[0].id;
    let min_id = tweets[0].id;

    tweets = tweets.map(tweet => {
        let id = tweet.id;

        if (id < min_id) {
            min_id = id;
        }

        if (id > max_id) {
            max_id = id;
        }

        let text = tweet.text;
        let entities = tweet.entities.hashtags;
        let retweet = false;

        const properties = Object.getOwnPropertyNames(tweet);

        if (properties.includes("retweeted_status")) {
            retweet = true;

            const retweet_status = Object.getOwnPropertyNames(tweet.retweeted_status);
            if (retweet_status.includes("extended_tweet")) {
                text = tweet.retweeted_status.extended_tweet.full_text;
                entities = tweet.retweeted_status.extended_tweet.entities.hashtags;
            }
        }

        let new_tweet = {
            text: text,
            username: tweet.user.name,
            screen_name: tweet.user.screen_name,
            created_at: tweet.created_at,
            hashtags: entities,
            language: tweet.lang,
            retweet: retweet
        };

        if (entities.length > 0) {
            new_tweets.push(new_tweet);
        }
    });

    data.statuses = new_tweets;
    data.search_metadata["min_id"] = min_id;
    data.search_metadata["maximum_id"] = max_id - 1;

    return data;
}

console.log("listening on port 8080");
app.listen(8080);