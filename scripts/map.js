mapboxgl.accessToken = 'pk.eyJ1IjoiZGNoZWFuZyIsImEiOiJjbTM3aXVka3YwZ2lpMmlwd2VndTN0NWw4In0.UNRVJNRE_fuqrK5LtRYHKg';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-24, 42],
    zoom: 1.75
});

const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true
});
map.addControl(geolocate, 'bottom-right');


const coordinatesGeocoder = function (query) {
    const matches = query.match(
        /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
    );
    if (!matches) {
        return null;
    }

    function coordinateFeature(lng, lat) {
        return {
            center: [lng, lat],
            geometry: {
                type: 'Point',
                coordinates: [lng, lat]
            },
            place_name: 'Lat: ' + lat + ' Lng: ' + lng,
            place_type: ['coordinate'],
            properties: {},
            type: 'Feature'
        };
    }

    const coord1 = Number(matches[1]);
    const coord2 = Number(matches[2]);
    const geocodes = [];

    if (coord1 < -90 || coord1 > 90) {
        geocodes.push(coordinateFeature(coord1, coord2));
    }

    if (coord2 < -90 || coord2 > 90) {
        geocodes.push(coordinateFeature(coord2, coord1));
    }

    if (geocodes.length === 0) {
        geocodes.push(coordinateFeature(coord1, coord2));
        geocodes.push(coordinateFeature(coord2, coord1));
    }

    return geocodes;
};

map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        localGeocoder: coordinatesGeocoder,
        zoom: 14,
        placeholder: 'Search',
        mapboxgl: mapboxgl,
        reverseGeocode: true,
    }),
);

let currentMarker;

currentMarker = new mapboxgl.Marker({
    color: "FFFFFF",
    draggable: true
})

map.on('click', (event) => {
    const coordinates = event.lngLat;
    
    if(currentMarker) {
        currentMarker.remove();
    }

    currentMarker = new mapboxgl.Marker()
      .setLngLat(coordinates)
      .addTo(map);
      map.flyTo({
        center: coordinates,
        zoom: 14,
        speed: 0.8,
        easing: function (t) { return t; }
      });

      const geocoderInput = document.querySelector('.mapboxgl-ctrl-geocoder input');
      if (geocoderInput) {
          // Set the new value as a Lat, Lng format
          geocoderInput.value = `Lat: ${coordinates.lat.toFixed(2)}, Lng: ${coordinates.lng.toFixed(2)}`;
      }
  });
