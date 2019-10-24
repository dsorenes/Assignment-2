import React from "react";
import { Map, Marker, GoogleApiWrapper } from "google-maps-react";
import PlacesAutocomplete, {geocodeByAddress, getLatLng,} from 'react-places-autocomplete';

class MapContainer extends React.Component {
    constructor(props){
        super(props);
        this.state = {
          tweets: [],
          query: '',
          count: '',
          type: '',
          address: '',
          markers: [{
              name: "Current position",
              position: {
                lat: 37.774929,
                lng: -122.419416
              },
              zoom: 10
            }]
        }
    }
    
    onChange(key, event) {
      if(event === undefined){
        return;
      }
      this.setState({
        [key]: event.target.value
      });
    }
  
    onSubmit(event) {
      // var text = this.state.markers.pop(position.lat);
      var latitude = this.state.markers[0].position.lat;
      var longitude = this.state.markers[0].position.lng;
      var query = this.state.query;
      var count = this.state.count;
      var type = this.state.type;
      var fetchString = '?query=' + query + '&result_type=' + type + '&count=' + count + '&geocode=' + latitude + ',' + longitude + ',7km'
      
      

      fetch("/search"+fetchString, {
        method: "GET",
        headers: {
            "Content-type": "application/x-www-form-urlencoded"
        }
        })
        .then(response => response.json())
        .then(result => this.setState({tweets: result}))
        
        // .then(response => response.map(res => {
        //   this.setState({tweets: res.id})
          
        // }))
      
      event.preventDefault();
    }
    
    
    getCurrentLocation = () => {
        navigator.geolocation.getCurrentPosition((pos) => {
            const coords = pos.coords;
            console.log(coords);
            this.setState({
                markers:[{
                    position:{
                        lat: coords.latitude,
                        lng: coords.longitude
                    },
                    zoom: 15
                }]
            })
            
        })
    }
    
    onMarkerDragEnd = (coord, index) => {
      const { latLng } = coord;
      const lat = latLng.lat();
      const lng = latLng.lng();
  
      this.setState(prevState => {
        const markers = [...this.state.markers];
        markers[index] = { ...markers[index], position: { lat, lng } };
        console.log(markers);
        // console.log(this.state.markers.pop().position);
        return { markers };
      });
      
    };

    handleChange = address => {
      this.setState({ address });
    };
    handleSelect = address => {
      geocodeByAddress(address)
        .then(results => getLatLng(results[0]))
        
        .then(latLng => this.setState({
          address: '',
          markers:[{
              position:{
                  lat: latLng.lat,
                  lng: latLng.lng
              },
              zoom: 15
          }]
        }))
        // .then(latLng => )
        .catch(error => console.error('Error', error));
    };
  
    render() {
        return (
          <div className="card mx-auto my-auto" style={{maxWidth: '50rem',width: "auto", top:'80px'}}>
            <button
                style={{marginTop:'1%',marginLeft:'1%', width:'98%'}}
                type="button"
                className="btn btn-dark"
                onClick={this.getCurrentLocation}>
                    Current Location
                </button>
                <PlacesAutocomplete
                  value={this.state.address}
                  onChange={this.handleChange}
                  onSelect={this.handleSelect}
                  
                >
                  {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                    <div>
                      <input
                        style={{marginTop:'1%', marginLeft:'1%', width:'98%'}}
                        {...getInputProps({
                          placeholder: 'Search Places ...',
                          className: 'location-search-input form-control',
                        })}
                      />
                      <div className="autocomplete-dropdown-container">
                        {loading && <div>Loading...</div>}
                        {suggestions.map(suggestion => {
                          const className = suggestion.active
                            ? 'suggestion-item--active'
                            : 'suggestion-item';
                          // inline style for demonstration purpose
                          const style = suggestion.active
                            ? { backgroundColor: '#fafafa', cursor: 'pointer' }
                            : { backgroundColor: '#ffffff', cursor: 'pointer' };
                          return (
                            <div
                              {...getSuggestionItemProps(suggestion, {
                                className,
                                style,
                              })}
                            >
                              <span>{suggestion.description}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  </PlacesAutocomplete>
                  <form onSubmit={ev => this.onSubmit(ev)}>
                <div className="container">
                  <div className='row'>
                    
                      <div className='col-6' style={{marginTop:'1%'}}>
                        <input className="form-control" type="text" placeholder="Search Query" onChange={this.onChange.bind(this, "query")}/>
                      </div>
                      <div className='col-sm'style={{marginTop:'1%'}}>
                        <select className="form-control" onChange={this.onChange.bind(this, "type")}>
                          <option>Select Type</option>
                          <option>recent</option>
                          <option>mixed</option>
                          <option>popular</option>
                        </select>  
                      </div>
                      <div className='col-sm'style={{marginTop:'1%'}}>
                        <select className="form-control" placeholder="Count" onChange={this.onChange.bind(this, "count")}>
                          <option>Select Count</option>
                          <option>1</option>
                          <option>5</option>
                          <option>10</option>
                          <option>15</option>
                        </select>
                      </div>
                    
                  </div>
                  <button
                    style={{marginTop:'2%',marginBottom:'2%',width:'99%'}}
                    type="submit"
                    className="btn btn-dark">
                        Search Tweets
                  </button>
                </div>
                
              </form>
              <div className="card body" style={{padding:"31%", margin:"2%"}}>
              <Map
                google={this.props.google}
                style={{
                  width: "100%",
                  height: "500px",
                  margin: '-32.4%'
                }}
                zoom={this.state.markers[0].zoom}
                center={this.state.markers[0].position}
              >
                {this.state.markers.map((marker, index) => (
                  <Marker
                    position={marker.position}
                    draggable={true}
                    onDragend={(t, map, coord) =>
                      this.onMarkerDragEnd(coord, index)
                    }
                    name={marker.name}
                  />
                ))}
              </Map>
              </div>

              <div className='container'>
                

                  {this.state.tweets.map((tweet) => (
                    <div className='row'>
                      <div className='col'>
                        <div className='card' style={{marginBottom:'2%'}}>
                          <div className="media">
                            <img src={tweet.profileImage} className="align-self-start mr-3 rounded circle" style={{marginTop:'1%', marginLeft:'1%'}} alt="..."/>
                            <div className="media-body" style={{marginTop:'1%'}}>
                              <h5 className="mt-0" id={tweet.userId}>{tweet.userName}</h5>
                              <p className=""  style={{marginTop:'-1%', marginBottom:'1%'}}><small className="text-muted">{tweet.screenName}</small></p>
                              <p>{tweet.text}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                
            </div> 
          </div>
          );
    }
}
  
export default GoogleApiWrapper({
    apiKey: "AIzaSyBIcm0822w2t_-eZg9CFm6hNFpie6yzj3s",
    v: "3.30"
})(MapContainer);