const natural = require('natural');
const nlp = require('compromise');

let tokenize = (tweets) => {
    let tokenizer = new natural.RegexpTokenizer({pattern: /[!@$%^&*(),.?":{}|<>'(...)]/g});

    let data = tweetsProcessing(tweets, true);

    data = data.map(tweet => tokenizer.tokenize(tweet));

    return data;
}

let hashtagsCount = (tweets) => {
    let hashtags = [];
    tweets.statuses.forEach(tweet => {
        tweet.hashtags.forEach(hashtag => hashtags.push(hashtag.text.toLowerCase()));
    })

    //Produces a map with key: hashtag, value: occurences
    const counted = hashtags.reduce((counted, hashtag) => counted.set(hashtag, 1 + (counted.get(hashtag) || 0)), new Map());
    let countedSorted = new Map([...counted.entries()].sort((a, b) => b[1] - a[1]));

    let hashtagsCount = [];
    for (let [key, value] of countedSorted) {
        hashtagsCount.push({
            hashtag: key,
            count: value
        });
    }

    return hashtagsCount;
}

let tweetsProcessing = (tweets, filter = false) => {
    const stopwords = require('./stopwords.js');
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

        if (filter) {
            words = words.filter(word => stopwords.includes(word) === false);
        }

        words = words.filter(word => word.includes('https') === false
        && word.includes('…') === false
        && word.includes('@') === false
        && word.includes('amp') === false
        && word.includes('rt') === false
        && word.includes('https') === false).join('.');

        return words;
    }); 

    return data;
}

let tweetsSentiment = (tweets) => {
    const Analyzer = require('natural').SentimentAnalyzer;
    let stemmer = require('natural').PorterStemmer;
    let analyzer = new Analyzer("English", stemmer, "afinn");

    let data = tweetsProcessing(tweets);

    let analysedTweets = data.map(tweet => {
        let score = analyzer.getSentiment(tweet.split('.'));
        let category = 'neutral';

        if (score > 0) {
            category = 'positive';
        }

        if (score < 0) {
            category = 'negative';
        }

        return {
            tweet_text: tweet.split('.').join(' '),
            score: score,
            category: category
            }
    });
    return analysedTweets;
}

let featureExtraction = (tweets, amount = 100) => {
    let TfIdf = natural.TfIdf;
    let tfidf = new TfIdf();
    
    let words = tokenize(tweets);

    document = words.map(tweet => tweet.join(' ')).join(' ');

    document = tfidf.addDocument(document);

    let features = [];

    for (let i = 0; i < amount; i++) {
        let feature_list = tfidf.listTerms(0);
        
        features.push(hashtag = {
            word: feature_list[i].term,
            importance: feature_list[i].tfidf
        });
    }

    return features;
}

module.exports = analyseTweets = (tweets) => {
    let top_features = featureExtraction(tweets);
    let sentimentAnalysis = tweetsSentiment(tweets);
    let hashtagCount = hashtagsCount(tweets);
    return {
        most_important_words: top_features,
        sentimentAnalysis_per_tweet: sentimentAnalysis,
        hashtagCount: hashtagCount
    };
}