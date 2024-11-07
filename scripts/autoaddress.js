mapboxgl.accessToken = 'pk.eyJ1IjoiZGNoZWFuZyIsImEiOiJjbTM3aXVka3YwZ2lpMmlwd2VndTN0NWw4In0.UNRVJNRE_fuqrK5LtRYHKg';

const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    type: 'poi,place'
});

geocoder.addTo('#geocoder');

const results = document.getElementById('result');

geocoder.on('clear', () => {
    results.innerText = '';
});