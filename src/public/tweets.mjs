const tweets = document.querySelector('#tweets');

let getTweets = async (query, count = 0, amount_of_tweets = 500) => {
    const options = {
        method: 'GET',
        headers : {
            'Content-Type': 'application/json'
        }
    }
    ///get/tweets?max_id=1184734400887394303&q=%23hongkong,%23china&count=100&include_entities=1
    await fetch(`/get/tweets${query}`, options)
    .then((response) => {
        return response.json();
    })
    .then(async (data) => {
        console.log(data);
        for (let i = 0; i < data.statuses.length; i++) {
            let tweet = data.statuses[i];
            const tweet_template = 
            `<div class="col-sm-4" id="tweet" flex-column-reverse>
                <div class="card">
                    <div class="card-body">
                        <p class="card-text">${tweet.text}</p>
                        <blockquote><footer class="blockquote-footer">${tweet.username}</footer></blockquote>
                        <p><b>${tweet.hashtags.map((hashtag) => {return '#' + hashtag.text}).join(' ')}</b></p>
                        <p>${tweet.created_at}</p>
                    </div>
                </div>
            </div>`;
            tweets.innerHTML += tweet_template;
        }
        let amount = data.statuses.length + count;

        let min_id = data.search_metadata.min_id;
        let max_id = data.search_metadata.maximum_id;
        let new_query = `?max_id=${min_id}&since_id=${max_id}&q=${data.search_metadata.query}&include_entities=1`;
        if (min_id === max_id) {
            console.log("finito");
            return "finished";
        }
        console.log(new_query);
        if (amount < amount_of_tweets) {
            console.log(amount);
            getTweets(new_query, amount);
        } else {
            console.log("finished");
        }
    }).catch((e) => console.log(e));
}

export default getTweets;