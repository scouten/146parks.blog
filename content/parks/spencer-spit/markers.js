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
    addGpxMarker(map, "es-4126-050", 48.5353646,-122.859847);
    // and a few more ...
}
