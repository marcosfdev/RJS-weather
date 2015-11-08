/*!
 * Demo ReactJS Weather Forecast App v 1.0
 * Using Google Maps Javascript API v 3.0
 * and React.js framework
/* ========================================================================
*/

// Initialize Google Maps geocoder, map, and global variables for API query URLs
var aerisURL;
var fioURL;
var geocoder;
var map;
var nwsURL;
var owmURL;

// Perform Google Maps API search to obtain lat/long coordinates and pass to other functions
function geocodeQuery() {
    var query = document.getElementById('search-query').value;
    geocoder.geocode( {'address': query }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            map.setZoom(14);
            var marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location
            });

            // The lat/lon coordinates and formatted address
            var location = results[0].formatted_address;
            var lat = results[0].geometry.location.lat();
            var lon = results[0].geometry.location.lng();
            passGeocodeData(lat, lon, location);
        } else {
            console.warn('Search was not successful for the following reason: ' + status);
        }
    });
    return false;
}

// Pass geocoded lat/lon coords to execute individual API searches
function passGeocodeData(lat, lon, location) {
    var locationName = 'Forecast for ' + location;
    $('#forecast-location').html(locationName);
    $('#forecast-location').fadeIn(500);

    // Pass lat/lon data to individual API URL constructor functions
    aerisURLConstructor(lat, lon);
    fioURLConstructor(lat, lon);
    owmURLConstructor(lat, lon);
    nwsURLConstructor(lat, lon);
}

// Aeris Weather API search
function aerisURLConstructor(lat, lon) {
    var clientID = 'hYzaqCcXG3zuT6KIr1eYs';
    var clientSecret = 'IyE336HflPAjOOVOq78YkVNQFcOa3eotcUPA5yTx';
    var apiURL = 'http://api.aerisapi.com/forecasts/' + lat + ',' + lon;
    aerisURL = apiURL + '?client_id=' + clientID + '&client_secret=' + clientSecret;
}

// forecast.io API search
function fioURLConstructor(lat, lon) {
    var apiURL = 'https://api.forecast.io/forecast/443657266ea05d95096d0c163363a33a/' + lat + ',' + lon;
    fioURL = apiURL;
}

// Open Weather Map API search
function owmURLConstructor(lat, lon) {
    var apiURL = 'http://api.openweathermap.org/data/2.5/forecast/daily?';
    var apiKey = '29199f223c2c870bf80d70ca804d5dbf'
    var queryString = 'lat=' + lat + '&lon=' + lon + '&cnt=5&mode=json&APPID=' + apiKey;
    var queryURL = apiURL + queryString;

    owmURL = queryURL;
}

// National Weather Service API search
function nwsURLConstructor(lat, lon) {
    var apiURL = 'http://forecast.weather.gov/MapClick.php?';
    var queryString = 'lat=' + lat + '&lon=' + lon + '&FcstType=json';
    var queryURL = apiURL + queryString;

    nwsURL = queryURL;
    console.log(nwsURL);
}

// Render AerisForecastContainer for Weather Underground, which will own other react components
var AerisForecastContainer = React.createClass({
    // Loads forecasts dynamically using AJAX
    loadForecastData: function() {
        // This ajax call only gets made if the owmURL variable is defined
        if (aerisURL != null) {
            $.ajax({
                type: 'GET',
                url: aerisURL,
                dataType: 'jsonp',
                cache: false,
                crossDomain: true,
                // If success call function setting the state of the component with data retrieved from API
                success: function(data) {
                    this.setState({data: data.response[0].periods.slice(0,5)});
                }.bind(this),
                // If error call function logging the error details  
                error: function(xhr, status, err) {
                    console.error(aerisURL, status, err.toString());
                }.bind(this)
            });
        }
    },
    // Set initial state of AerisForecastContainer as an empty array that will hold forecast data later
    getInitialState: function() {
        return {data: []};
    },
    // Automatically called just after component renders to the DOM, calls the function
    // that dynamically generates the forecasts from the queried API
    componentDidMount: function() {
        this.loadForecastData();
        setInterval(this.loadForecastData, this.props.pollInterval);
    },
    render: function() {
        // Renders a AerisForecastContainer div that contains the ForecastGrid
        return (
            // ForecastGrid is generated from JSON from a data source            
            <div className="AerisForecastContainer">
                <h3>Aeris Weather </h3>
                <AerisForecastGrid data={this.state.data} />
            </div>
        );
    }
});

// ForecastGrid component contains an iterable forecastNodes sub-component
var AerisForecastGrid = React.createClass({
    render: function() {
        // forecastNodes populate with forecast data mapped from JSON returned by API call
        var forecastNodes = this.props.data.map(function(forecast){
            return (
                <AerisForecastDay>
                    {forecast.weather}
                    {forecast.maxTempF}
                    {forecast.minTempF}
                    {forecast.pressureMB}
                    {forecast.humidity}
                    {forecast.windSpeedMPH}
                    {forecast.windDirDEG}
                    {forecast.sky}
                    {forecast.timestamp}
                </AerisForecastDay>
            );
        });
        // forecastGrid is returned with all forecastNodes rendered
        return (
            <ul className="aerisForecastGrid">
                {forecastNodes}
            </ul>
        );
    }
});

// Individual ForecastDay components, referencing this.props.children listed in forecastNodes
var AerisForecastDay = React.createClass({   
    convertWindDirection: function() {
        var degrees = this.props.children[6];
        var val = Math.round((((degrees/22.5) + 0.5)) % 16);
        var directions = [
            'North', 
            'North-Northeast', 
            'Northeast', 
            'East-Northeast', 
            'East', 
            'East-Southeast', 
            'Southeast', 
            'South-Southeast', 
            'South', 
            'South-Southwest', 
            'Southwest', 
            'West-Southwest', 
            'West', 
            'West-Northwest', 
            'Northwest', 
            'North-Northwest'
            ];
        return windDir = (directions[val]);
    },
    // Converts UNIX timestamps to human readable dates
    convertUnixTime: function() {
        var time = this.props.children[8];
        var options = {
            weekday: 'short', year: 'numeric', month: 'short',
            day: 'numeric'
        };
        return new Date(time * 1000).toLocaleDateString('en-us', options);        
    },     
    render: function() {
        this.convertWindDirection();
        return (
            <li className="aerisForecastDay">
                <h4 className="forecastTime">
                    {this.convertUnixTime()}
                </h4>
                <h5>{this.props.children[0]}</h5>
                <p>High: {this.props.children[1]}ºF</p>
                <p>Low: {this.props.children[2]}ºF</p>
                <p>Pressure: {this.props.children[3]}mb</p>
                <p>Humidity: {this.props.children[4]}%</p>
                <p>Wind Speed: {this.props.children[5]}mph</p>
                <p>Wind Direction: {windDir}</p>
                <p>Cloud Cover: {this.props.children[7]}%</p>
            </li>
        );
    }
});

// Renders the AerisForecastContainer in the specified template element
React.render(
    <AerisForecastContainer pollInterval={500} />,
    document.getElementById('aeris-content')
); 


// Render FioForecastContainer for Forecast.io, which will own other react components
var FioForecastContainer = React.createClass({
    // Loads forecasts dynamically using AJAX
    loadForecastData: function() {
        // This ajax call only gets made if the owmURL variable is defined
        if (fioURL != null) {
            $.ajax({
                type: 'GET',
                url: fioURL,
                dataType: 'jsonp',
                cache: false,
                crossDomain: true,
                // If success call function setting the state of the component with data retrieved from API
                success: function(data) {
                    this.setState({data: data.daily.data.slice(0,5)});
                }.bind(this),
                // If error call function logging the error details  
                error: function(xhr, status, err) {
                    console.error(fioURL, status, err.toString());
                }.bind(this)
            });
        }
    },
    // Set initial state of FioForecastContainer as an empty array that will hold forecast data later
    getInitialState: function() {
        return {data: []};
    },
    // Automatically called just after component renders to the DOM, calls the function
    // that dynamically generates the forecasts from the queried API
    componentDidMount: function() {
        this.loadForecastData();
        setInterval(this.loadForecastData, this.props.pollInterval);
    },
    render: function() {
        // Renders a FioForecastContainer div that contains the ForecastGrid
        return (
            // ForecastGrid is generated from JSON from a data source            
            <div className="FioForecastContainer">
                <h3>Forecast.io </h3>
                <FioForecastGrid data={this.state.data} />
            </div>
        );
    }
});

// ForecastGrid component contains an iterable forecastNodes sub-component
var FioForecastGrid = React.createClass({
    render: function() {
        // forecastNodes populate with forecast data mapped from JSON returned by API call
        var forecastNodes = this.props.data.map(function(forecast){
            return (
                <FioForecastDay>
                    {forecast.summary}
                    {forecast.temperatureMax}
                    {forecast.temperatureMin}
                    {forecast.pressure}
                    {forecast.humidity * 100}
                    {forecast.windSpeed}
                    {forecast.windBearing}
                    {forecast.cloudCover}
                    {forecast.time}
                </FioForecastDay>
            );
        });
        // forecastGrid is returned with all forecastNodes rendered
        return (
            <ul className="fioForecastGrid">
                {forecastNodes}
            </ul>
        );       
    }
});

// Individual ForecastDay components, referencing this.props.children listed in forecastNodes
var FioForecastDay = React.createClass({
    convertWindDirection: function() {
        var degrees = this.props.children[6];
        var val = Math.round((((degrees/22.5) + 0.5)) % 16);
        var directions = [
            'North', 
            'North-Northeast', 
            'Northeast', 
            'East-Northeast', 
            'East', 
            'East-Southeast', 
            'Southeast', 
            'South-Southeast', 
            'South', 
            'South-Southwest', 
            'Southwest', 
            'West-Southwest', 
            'West', 
            'West-Northwest', 
            'Northwest', 
            'North-Northwest'
            ];
        return windDir = (directions[val]);
    },
    // Converts UNIX timestamps to human readable dates
    convertUnixTime: function() {
        var time = this.props.children[8];
        var options = {
            weekday: 'short', year: 'numeric', month: 'short',
            day: 'numeric'
        };
        return new Date(time * 1000).toLocaleDateString('en-us', options);        
    },    
    render: function() {
        this.convertWindDirection();
        return (
            <li className="fioForecastDay">
                <h4 className="forecastTime">
                    {this.convertUnixTime()}
                </h4>
                <h5>{this.props.children[0]}</h5>
                <p>High: {this.props.children[1]}ºF</p>
                <p>Low: {this.props.children[2]}ºF</p>
                <p>Pressure: {this.props.children[3]}mb</p>
                <p>Humidity: {this.props.children[4]}%</p>
                <p>Wind Speed: {this.props.children[5]}mph</p>
                <p>Wind Direction: {windDir}</p>
                <p>Cloud Cover: {Math.round(this.props.children[7] * 100)}%</p>
            </li>
        );
    }
});

// Renders the FioForecastContainer in the specified template element
React.render(
    <FioForecastContainer pollInterval={5000} />,
    document.getElementById('fio-content')
); 

// Render OwmForecastContainer for Open Weather Map, which will own other react components
var OwmForecastContainer = React.createClass({
    // Loads forecasts dynamically using AJAX
    loadForecastData: function() {
        // This ajax call only gets made if the owmURL variable is defined
        if (owmURL != null) {
            $.ajax({
                url: owmURL,
                dataType: 'json',
                cache: false,
                crossDomain: true,                
                // If success call function setting the state of the component with data retrieved from API
                success: function(data) {
                    this.setState({data: data.list});
                }.bind(this),
                // If error call function logging the error details  
                error: function(xhr, status, err) {
                    console.error(owmURL, status, err.toString());
                }.bind(this)
            });
        }
    },
    // Set initial state of OwmForecastContainer as an empty array that will hold forecast data later
    getInitialState: function() {
        return {data: []};
    },
    // Automatically called just after component renders to the DOM, calls the function
    // that dynamically generates the forecasts from the queried API
    componentDidMount: function() {
        this.loadForecastData();
        setInterval(this.loadForecastData, this.props.pollInterval);
    },
    render: function() {
        // Renders a OwmForecastContainer div that contains the ForecastGrid
        return (
            // ForecastGrid is generated from JSON from a data source            
            <div className="OwmForecastContainer">
                <h3>Open Weather Map </h3>
                <OwmForecastGrid data={this.state.data} />
            </div>
        );
    }
});

// ForecastGrid component contains an iterable forecastNodes sub-component
var OwmForecastGrid = React.createClass({
    render: function() {
        // forecastNodes populate with forecast data mapped from JSON returned by API call
        var owmforecastNodes = this.props.data.map(function(forecast){
            return (
                <OwmForecastDay>
                    {forecast.temp.max}
                    {forecast.temp.min}
                    {forecast.pressure}
                    {forecast.humidity}
                    {forecast.weather[0].main}
                    {forecast.speed}
                    {forecast.deg}
                    {forecast.clouds}
                    {forecast.dt}
                </OwmForecastDay>
            );
        });
        // forecastGrid is returned with all owmforecastNodes rendered
        return (
            <ul className="owmForecastGrid">
                {owmforecastNodes}
            </ul>
        );       
    }
});

// Individual ForecastDay components, referencing this.props.children listed in owmforecastNodes
var OwmForecastDay = React.createClass({
    convertWindDirection: function() {
        var degrees = this.props.children[6];
        var val = Math.round((((degrees/22.5) + 0.5)) % 16);
        var directions = [
            'North', 
            'North-Northeast', 
            'Northeast', 
            'East-Northeast', 
            'East', 
            'East-Southeast', 
            'Southeast', 
            'South-Southeast', 
            'South', 
            'South-Southwest', 
            'Southwest', 
            'West-Southwest', 
            'West', 
            'West-Northwest', 
            'Northwest', 
            'North-Northwest'
            ];
        return windDir = (directions[val]);
    },
    // Converts UNIX timestamps to human readable dates
    convertUnixTime: function() {
        var time = this.props.children[8];
        var options = {
            weekday: "short", year: "numeric", month: "short",
            day: "numeric"
        };
        return new Date(time * 1000).toLocaleDateString("en-us", options);        
    },
    render: function() {
        this.convertWindDirection();
        return (
            <li className="owmForecastDay">
                <h4 className="forecastTime">
                    {this.convertUnixTime()}
                </h4>
                <h5>{this.props.children[4]}</h5>
                <p>High: {((this.props.children[0] - 273.15) * 1.8 + 32).toFixed(2)}ºF</p>
                <p>Low: {((this.props.children[1] - 273.15) * 1.8 + 32).toFixed(2)}ºF</p>
                <p>Pressure: {this.props.children[2]}mb</p>
                <p>Humidity: {this.props.children[3]}%</p>
                <p>Wind Speed: {(this.props.children[5] * 2.23693629).toFixed(2)}mph</p>
                <p>Wind Direction: {windDir}</p>
                <p>Cloud Cover: {this.props.children[7]}%</p>
            </li>
        );
    }
});

// Renders the OwmForecastContainer in the specified template element
React.render(
    <OwmForecastContainer pollInterval={5000} />,
    document.getElementById('owm-content')
);


// Geolocation by getting client IP address
$(function() {
    // Get client's GPS coords if enabled, else throw error message
    function getCoords() {
        function success(position) {
            var clientLat = position.coords.latitude;
            var clientLon = position.coords.longitude;
            passCoords(clientLat, clientLon);
        };

        function error(err) {
            console.warn('ERROR(' + err.code + '): ' + err.message);
        };

        navigator.geolocation.getCurrentPosition(success, error);
    }
    getCoords();

    // TODO - function auto executes on window load, passing lat lon coords to api search funcs
    function passCoords(clientLat, clientLon) {
        console.log(clientLat);
    }  

    // WearProtection.js functions below - source: https://gist.github.com/broinjc/db6e0ac214c355c887e5
    // This function gets cookie with a given name 
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    var csrftoken = getCookie('csrftoken');

    /*
    The functions below will create a header with csrftoken
    */

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }
    function sameOrigin(url) {
        // test that a given url is a same-origin URL
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }

    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url)) {
                // Send the token to same-origin, relative URLs only.
                // Send the token only if the method warrants CSRF protection
                // Using the CSRFToken value acquired earlier
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

});