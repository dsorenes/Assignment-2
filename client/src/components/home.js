import React from 'react';
import './fonts.css';
import { Link, Route, Switch } from 'react-router-dom';
import SearchTweets from "./search";
class Homepage extends React.Component {
    render(){
        return(
            <div>
                <div className='container' style={{marginTop:'10%'}}>
                    <h1 className="display-1 permanent-marker" style={{margin:'auto', maxWidth:'65.5%', fontSize:'10rem'}}>Tweet Analyzer</h1>
                    <button type="button" className="btn btn-outline-dark btn-lg" style={{marginLeft:'45%', marginTop:'1%'}}><Link to="/search" style={{color:'black'}}>Start</Link></button>
                </div>
                <div>
                    <Switch>
                        <Route exact path="/search" component={SearchTweets}/>
                    </Switch>
                </div>
            </div>
            
        )
    }
};

export default Homepage;