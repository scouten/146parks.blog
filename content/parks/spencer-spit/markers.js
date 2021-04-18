function addGpxMarker(map, id, lat, lon) {
    const contentString =
        '<div class="gpx-marker">' +
        '<h1>hello?</h1>' +
        '<a href="#' + id + '"><img src="' + id + '.jpg" alt=""></a>' +
        '</div>';

    const infowindow = new google.maps.InfoWindow({
        content: contentString,
        maxWidth: 200,
    });

    const marker = new google.maps.Marker({
        position: { lat: lat, lng: lon },
        map,
        title: "{{id}}",
    });

    marker.addListener("click", () => {
        infowindow.open(map, marker);
    });
}

function addGpxMarkers(map) {
    addGpxMarker(map, "es-4126-050", 48.5353646, -122.859847);
    addGpxMarker(map, "es-4126-051", 48.5353091, -122.8592665);
    addGpxMarker(map, "es-4127-013", 48.5353556, -122.859216);
    addGpxMarker(map, "es-4127-017", 48.5353556, -122.859216);
    addGpxMarker(map, "es-4126-052", 48.5357174, -122.8578331);
    addGpxMarker(map, "es-4127-021", 48.5357163, -122.8578298);
    addGpxMarker(map, "es-4127-025", 48.536609, -122.852502);
    addGpxMarker(map, "es-4127-026", 48.536684, -122.852275);
    addGpxMarker(map, "es-4127-028", 48.536609, -122.851686);
    addGpxMarker(map, "es-4126-061", 48.536358, -122.852775);
    addGpxMarker(map, "es-4127-042", 48.535371, -122.857749);
}
