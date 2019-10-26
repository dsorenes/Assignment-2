import React from "react";
import ReactWordcloud from 'react-wordcloud';
import {Button,Tabs,message, Slider } from 'antd';
//Icons
import HappyIcon from '../icons/happy.png';
import NeutralIcon from '../icons/confused.png';
import SadIcon from '../icons/sad.png';


const { TabPane } = Tabs;

class SearchTweets extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tweets: [],
      query: "",
      count: "",
      hashtagCount: [],
      most_important_words: [],
      sentimentAnalysis_per_tweet: [],
      displayWordCloud: false,
      isLoading: false,
      wordcloud: "",
      positiveCount: "",
      negativeCount: "",
      neutralCount: "",

    };
    
  }

  onChange(key, event) {
    if (event === undefined) {
      return;
    }
    this.setState({
      [key]: event.target.value
    });
    
  }

  sliderOnChange(value) {
    console.log('onChange: ', value);
  }
  
  sliderOnAfterChange = (value) => {
    this.setState({count: value});
    console.log('onAfterChange: ', value);
  }
  info = () => {
    message.success('Search Started!');
  };  

  fetchOnSubmit = () => {
    console.log(this.state);
    
    let query = this.state.query.split(' ').join('+OR+#');
    let count = this.state.count;
    let fetchString = "?q=%23" + encodeURIComponent(query) + "&amount=" + count;
    console.log(fetchString);

    const request = async () => {
      this.setState({ isLoading: true });
      const response = await fetch(
        "http://localhost:8080/get/tweets" + fetchString,
        {
          method: "GET",
          headers: {
            "Content-type": "application/x-www-form-urlencoded"
          }
        }
      );
      const json = await response.json();
      const newJSON = Object.values(json)[1];
      console.log(json);
      console.log(newJSON);
      this.setState({
        hashtagCount: newJSON.hashtagCount,
        most_important_words: newJSON.most_important_words,
        sentimentAnalysis_per_tweet: newJSON.sentimentAnalysis_per_tweet,
        displayWordCloud: true,
        isLoading: false
      });
      this.sortTweet();
    };

    request();
    this.sortTweet();
    
  };
  buttonOnClick = () =>{
    this.info();
    this.fetchOnSubmit();
  }
  sortTweet = () => {
    let sentimentTweetsArray = this.state.sentimentAnalysis_per_tweet;
    var positiveCount = 0;
    var negativeCount = 0;
    var neutralCount = 0;
    
    for(let i = 0; i < sentimentTweetsArray.length; i++) {
      
      if(sentimentTweetsArray[i].category === "positive"){
        positiveCount++;
      } else if(sentimentTweetsArray[i].category === "negative"){
        negativeCount++;
      }else if(sentimentTweetsArray[i].category === "neutral"){
        neutralCount++;
      }
    }
    
    this.setState({
      negativeCount: negativeCount,
      positiveCount: positiveCount,
      neutralCount: neutralCount,
    });
  }
  refreshPage=()=>{
    window.location.reload();
  }
  render() {
    return (
      <div
        className="card mx-auto my-auto"
        style={{ maxWidth: "60rem", width: "auto", top: "80px" }}
      >
        <div className="container">
          <div className="row">
            <div className="col-6" style={{ marginTop: "1%" }}>
              <input
                className="form-control"
                type="text"
                placeholder="Search Query"
                onChange={this.onChange.bind(this, "query")}
              />
            </div>

            <div className="col-sm" style={{ marginTop: "1%" }}>
              <Slider
                min={50}
                max={500}
                onChange={this.sliderOnChange}  
                onAfterChange={this.sliderOnAfterChange}
                
              />
            </div>
          </div>
          <button
            style={{ marginTop: "2%", marginBottom: "2%", width: "99%" }}
            type="submit"
            className="btn btn-dark"
            onClick={this.buttonOnClick}
          >
            Search Tweets
          </button>
          
          <Button type="primary" onClick={this.refreshPage} style={{marginBottom:'1%'}}>
            Reload
          </Button>

          {/* Loading Spinner */}
          {this.state.isLoading ? (
            <div className="d-flex justify-content-center">
              <div
                className="spinner-border"
                role="status"
                style={{ marginBottom: "1%" }}
              >
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : (
            ""
          )}

          
          {this.state.displayWordCloud ? (
            <Tabs defaultActiveKey="1">
              <TabPane tab="Hashtag Word Cloud" key="1">
              <div style={{ height: "400px", width: "100%" }}>
                <ReactWordcloud
                  words={this.state.hashtagCount}
                  options={{
                    fontSizes: [16, 72],
                    transitionDuration: 100,
                    scale: "log",
                    spiral: "rectangular"
                  }}
                />
              </div>
              </TabPane>
              <TabPane tab="Sentiment Analysis" key="2">
                  <div className="container" style={{textAlign: 'center'}}>
                    <div className="row justify-content-md-center">
                      <div className="col-sm">
                        <img src={HappyIcon} alt="Positive" style={{maxWidth: '30%'}}/>
                        <h6 className="h6">Positive Tweet Count</h6><p className="lead">{this.state.positiveCount}</p>
                      </div>
                      <div className="col-sm">
                        <img src={NeutralIcon} alt="Neutral" style={{maxWidth: '30%'}}/>
                        <h6 className="h6">Neutral Tweet Count</h6><p className="lead">{this.state.neutralCount}</p>
                      </div>
                      <div className="col-sm">
                        <img src={SadIcon} alt="Sad" style={{maxWidth: '30%'}}/>
                        <h6 className="h6">Negative Tweet Count</h6><p className="lead">{this.state.negativeCount}</p>
                      </div>
                    </div>
                  </div>
              </TabPane>
              <TabPane tab="Important Word Cloud" key="3">
              <div style={{ height: 400, width: "100%" }}>
                <ReactWordcloud
                  words={this.state.most_important_words}
                  options={{
                    fontSizes: [16, 80],
                    transitionDuration: 1000,
                    scale: "log",
                    spiral: "rectangular"
                  }}
                />
                </div>
              </TabPane>
            </Tabs>


            


          ) : (
            ""
          )}
        </div>
      </div>
    );
  }
}

export default SearchTweets;
