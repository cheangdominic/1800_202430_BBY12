document.addEventListener("DOMContentLoaded", function () {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGNoZWFuZyIsImEiOiJjbTM3aXVka3YwZ2lpMmlwd2VndTN0NWw4In0.UNRVJNRE_fuqrK5LtRYHKg';

    const map = new mapboxgl.Map({
        container: 'map', // Initialize the map container
        style: 'mapbox://styles/mapbox/streets-v12', // Set the map style
        center: [-24, 42], // Set the initial map center
        zoom: 1.75 // Set the initial zoom level
    });

    const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true // Enable high accuracy for geolocation
        },
        trackUserLocation: true, // Track the user's location
        showUserHeading: true // Show the user's heading
    });
    map.addControl(geolocate, 'top-left'); // Add geolocate control to the map

    map.on('load', () => {
        geolocate.trigger(); // Trigger geolocation when map is loaded
    });

    const coordinatesGeocoder = function (query) {
        const matches = query.match(
            /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
        ); // Match latitude and longitude in the query
        if (!matches) {
            return null; // Return null if the format doesn't match
        }

        function coordinateFeature(lng, lat) {
            return {
                center: [lng, lat], // Return the coordinates as a feature
                geometry: {
                    type: 'Point',
                    coordinates: [lng, lat] // Set the point coordinates
                },
                place_name: 'Lat: ' + lat + ' Lng: ' + lng, // Format the place name
                place_type: ['coordinate'], // Set the place type
                properties: {},
                type: 'Feature'
            };
        }

        const coord1 = Number(matches[1]);
        const coord2 = Number(matches[2]);
        const geocodes = [];

        if (coord1 < -90 || coord1 > 90) {
            geocodes.push(coordinateFeature(coord1, coord2)); // Handle coordinate format
        }

        if (coord2 < -90 || coord2 > 90) {
            geocodes.push(coordinateFeature(coord2, coord1)); // Handle reversed coordinates
        }

        if (geocodes.length === 0) {
            geocodes.push(coordinateFeature(coord1, coord2)); // Add both coordinates
            geocodes.push(coordinateFeature(coord2, coord1));
        }

        return geocodes; // Return the geocode results
    };

    map.addControl(
        new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            localGeocoder: coordinatesGeocoder, // Use custom geocoder
            zoom: 14, // Set the zoom level for search
            placeholder: 'Search', // Set the search placeholder
            types: 'poi', // Restrict the search to points of interest
            mapboxgl: mapboxgl,
            reverseGeocode: true, // Enable reverse geocoding
        }),
    );

    let currentMarker;

    map.on('click', async (event) => {
        const coordinates = event.lngLat; // Get the coordinates of the click event

        if (currentMarker) {
            currentMarker.remove(); // Remove the existing marker if present
        }

        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json?access_token=${mapboxgl.accessToken}`);
        const data = await response.json(); // Fetch address data from Mapbox API

        const address = data.features[0] ? data.features[0].place_name : "Unknown location"; // Get the address from the response

        currentMarker = new mapboxgl.Marker({
            color: "#00008B", // Set the marker color
            draggable: false // Make the marker non-draggable
        })
        .setLngLat(coordinates) // Set the marker coordinates
        .setPopup(new mapboxgl.Popup().setText(address)) // Set the popup text
        .addTo(map); // Add the marker to the map

        map.flyTo({
            center: coordinates, // Fly to the clicked location
            zoom: 14, // Zoom in to level 14
            speed: 0.8, // Set the speed of the fly-to animation
            easing: (t) => t // Set the easing function for the animation
        });
        currentMarker.togglePopup(); // Toggle the popup for the marker
    });
});
