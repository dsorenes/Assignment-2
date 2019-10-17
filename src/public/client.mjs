
const search = document.querySelector('#search');
const input = document.querySelector('#hashtags');
const filter = document.querySelector('#hashtag-filter');
const delete_button = document.querySelector('.delete');
let finished = false;

import getTweets from '/tweets.mjs';
input.focus();

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