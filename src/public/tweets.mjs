let getTweets = async (query, amount_of_tweets = 500) => {
	const options = {
		method: "GET",
		headers: {
			"Content-Type": "application/json"
		}
	};
	await fetch(`/get/tweets${query}&amount=${amount_of_tweets}`, options)
		.then(response => {
			return response.json();
		})
		.then(async data => {
			console.log(data);
		})
		.catch(e => console.log(e));
};

export default getTweets;