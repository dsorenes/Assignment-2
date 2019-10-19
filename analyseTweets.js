const natural = require('natural');
const nlp = require('compromise');

let tokenize = (tweets) => {
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
        && word.includes('@') === false
        && word.includes('amp')).join('.');

        return words;
    });
    data = data.map(tweet => tokenizer.tokenize(tweet));

    return data;
}

module.exports = featureExtraction = (tweets, amount = 100) => {
    let TfIdf = natural.TfIdf;
    let tfidf = new TfIdf();
    
    let words = tokenize(tweets);

    document = words.map(tweet => tweet.join(' ')).join(' ');

    document = tfidf.addDocument(document);

    let features = new Map();

    for (let i = 0; i < amount; i++) {
        let feature_list = tfidf.listTerms(0);
        
        features.set(feature_list[i].term, feature_list[i].tfidf);
    }

    return features;
}