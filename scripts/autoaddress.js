mapboxgl.accessToken = 'pk.eyJ1IjoiZGNoZWFuZyIsImEiOiJjbTM3aXVka3YwZ2lpMmlwd2VndTN0NWw4In0.UNRVJNRE_fuqrK5LtRYHKg';
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    types: 'country,region,place,postcode,locality,neighborhood'
});

geocoder.addTo('#geocoder');

let selectedAddress = "";

geocoder.on('result', (event) => {
    selectedAddress = event.result.place_name;
    console.log(`Selected Address: ${selectedAddress}`);
});

geocoder.on('clear', () => {
    selectedAddress = "";
    results.innerText = '';
});