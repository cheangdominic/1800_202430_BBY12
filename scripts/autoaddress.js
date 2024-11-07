mapboxgl.accessToken = 'pk.eyJ1IjoiZGNoZWFuZyIsImEiOiJjbTM3aXVka3YwZ2lpMmlwd2VndTN0NWw4In0.UNRVJNRE_fuqrK5LtRYHKg';

let selectedAddress = "";

const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    types: 'poi,place'
});

geocoder.addTo('#geocoder');

geocoder.on('result', function (e) {

    selectedAddress = e.result.place_name;
});