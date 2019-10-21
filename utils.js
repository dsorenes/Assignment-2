//sometimes there is an error here where tweets[0].id is undefined. This needs to be fixed.
//The reason it's happening is because the data passed as parameter is empty [].

let parseTweets = data => {
	if (data === undefined || data.statuses === undefined || data === []) {
		return { error: "no tweets available" };
	}

	let new_tweets = [];
	let tweets = data.statuses;
	let max_id = tweets[0].id;
	let min_id = tweets[0].id;

	tweets = tweets.map(tweet => {
		let id = tweet.id;

		let text = tweet.text;
		let entities = tweet.entities.hashtags;
		let retweet = false;

		if (id < min_id) {
			min_id = id;
		}

		if (id > max_id) {
			max_id = id;
		}

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
};

module.exports = { parseTweets };
