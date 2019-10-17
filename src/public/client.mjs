
const search = document.querySelector('#search');
const input = document.querySelector('#hashtags');
const filter = document.querySelector('#hashtag-filter');
const delete_button = document.querySelector('.delete');
let finished = false;

import getTweets from '/tweets.mjs';
input.focus();
let stream = async (hashtags, amount = 500) => {
    const options = {
        method: 'GET',
        headers : {
            'Content-Type': 'application/json'
        }
    }
    await fetch(`/get/tweets?max_id=1184734400887394303&q=%23hongkong_%23china&count=100&include_entities=1`, options)
    .then((response) => {
        return response.json();
    })
    .then(async (data) => {
        let count = data.search_metadata.count;
        if (count > amount) {
            await fetch(`/get/tweets/next${data.search_metadata.next_results}`, options)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                console.log(data);
            });
        }
        console.log(count);
        console.log(data);
    }).catch((e) => console.log(e));
}

let hash = [];
input.addEventListener('keyup', (text) => {
    let character = text.key;
    if (character != null && (character === ' ' || text.key === 'Enter' || text.key === 'Tab')) {
        let word = input.value.split(' ');
        hash.push('#'.concat(word[0]));
        input.value = "";
        filter.innerHTML = hash.map((hashtag) => {
            return `<span class="badge badge-pill badge-success" id="hashtag">${hashtag}</span>`;
        }).join(' ');
    }
});

search.addEventListener('click', async () => {
    let tags = "?q=";
    for (let i in hash) {
        tags += `${encodeURIComponent(hash[i])}+`;
    }
    console.log(tags.slice(0, -1));
    if (search.classList.contains('btn-primary')) {
        search.className = "main-input btn btn-danger";
        search.innerHTML = "Searching..";
        await getTweets(tags.slice(0, -1));
    } else {
        search.className = "main-input btn btn-primary";
        search.innerHTML = "Search";
    }
});
/*         let next_results = await fetch(`/get/tweets/next${response.json().search_metadata.next_results}`, options); */
        /*.then(response => {
            console.log(response.json());
            let count = 0;
             return new ReadableStream({
                start(controller) {
                    return pump();
                    async function pump () {
                        return reader.read().then(({done, value}) => {
                            if (done || finished) {
                                controller.close();
                                return;
                            }
                            try {
                                const data = JSON.parse();
                                c
                                count += 1;
                                console.log(count);
                                console.log(data);
                            } catch(e) {
                               console.log(e); 
                            }
                            
                            controller.enqueue(value);
                            return pump();
                        });
                    }
                }
            }) */