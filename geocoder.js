var geocoder = require('geocoder');

geocoder.geocode("新宿", function( err, data) {
    console.log(data.results[0].formatted_address.split(",")[0])
});