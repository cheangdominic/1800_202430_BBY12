mapboxgl.accessToken = 'pk.eyJ1IjoiZGNoZWFuZyIsImEiOiJjbTM3aXVka3YwZ2lpMmlwd2VndTN0NWw4In0.UNRVJNRE_fuqrK5LtRYHKg';  // Set the Mapbox access token

let selectedAddress = "";  // Initialize a variable to store the selected address

const geocoder = new MapboxGeocoder({  // Create a new Mapbox Geocoder instance
    accessToken: mapboxgl.accessToken,  // Pass the Mapbox access token to the geocoder
    types: 'poi'  // Restrict search results to points of interest (POI)
});

geocoder.addTo('#geocoder');  // Add the geocoder widget to the DOM element with the ID 'geocoder'

geocoder.on('result', function (e) {  // Add an event listener for when a result is selected
    selectedAddress = e.result.place_name;  // Store the selected address in the variable
});
