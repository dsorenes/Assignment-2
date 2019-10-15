
const search = document.querySelector('#search');
const input = document.querySelector('#hashtags');
const tweets = document.querySelector('#tweets');
let stream = async (hashtags) => {
    const options = {
        method: 'GET',
        headers : {
            'Content-Type': 'application/json'
        }
    }
    console.log(hashtags);
    try {
        
        fetch(`stream${hashtags}`, options).then(response => {
            const reader = response.body.getReader();
            return new ReadableStream({
                start(controller) {
                    return pump();
                    async function pump () {
                        return reader.read().then(({done, value}) => {
                            if (done) {
                                controller.close();
                                return;
                            }
                            let data = JSON.parse(new TextDecoder().decode(value));
                            const tweet = `<div class="col-4">
                              <div class="card">
                                <div class="card-body">
                                  <p class="card-text">${data.data.text}</p>
                                  <p><bold>${data.matching_rules[0].tag}</bold></p>
                                </div>
                              </div>
                            </div>`;
                            tweets.innerHTML += tweet;
                            console.log(data);
                            controller.enqueue(value);
                            return pump();
                        });
                    }
                }
            })
            
        })
        .then(stream => new Response(stream));
    } catch (error) {
        console.log(error);
    }
}
let value = '';
let hash = [];
input.addEventListener('input', (text) => {
    let character = text.data;
    if (character != null) {

        value = value.concat(character);
        if (character === ' ') {
            if (!hash.includes(value.slice(0, -1))) {
                if (value.substr(0, 1) === '#') {
                    hash.push(value.slice(0, -1))
                    console.log(hash);
                    value = '';
                }
                console.log("space");
            }

        }
    }
})

search.addEventListener('click', () => {
    if (search.classList.contains('btn-primary')) {
        search.className = "btn btn-danger";
        search.innerHTML = "Searching..";
    } else {
        search.className = "btn btn-primary";
        search.innerHTML = "Search";
    }
    const hashtags = input.value.split(' ');
    console.log(hashtags);
    let tags = "?";
    for (let i in hashtags) {
        tags += `hashtags=${encodeURIComponent(hashtags[i])}&`;
        console.log(tags);
    }
    //stream(tags.slice(0, -1));    
});