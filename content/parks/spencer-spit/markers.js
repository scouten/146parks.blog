var prevInfoWindow = false;

function openInfoWindow(map, infoWindow, marker) {
    closeInfoWindow(prevInfoWindow);
    if (infoWindow) {
        infoWindow.open(map, marker);
        prevInfoWindow = infoWindow;
    }
}

function closeInfoWindow(infoWindow) {
    if (prevInfoWindow) {
        infoWindow.close();
        if (prevInfoWindow == infoWindow) {
            prevInfoWindow = false;
        }
    }
}

function addGpxMarker(map, id, lat, lon) {
    const contentString =
        '<div class="gpx-marker">' +
        '<h1>hello?</h1>' +
        '<a href="#' + id + '"><img src="' + id + '.jpg" alt=""></a>' +
        '</div>';

    const infoWindow = new google.maps.InfoWindow({
        content: contentString,
        maxWidth: 240,
    });

    const marker = new google.maps.Marker({
        position: { lat: lat, lng: lon },
        map,
        title: "{{id}}",
    });


    marker.addListener("click", () => {
        openInfoWindow(map, infoWindow, marker);
    });
    
    marker.addListener("mouseover", () => {
        openInfoWindow(map, infoWindow, marker);
    });

    marker.addListener("mouseout", () => {
        closeInfoWindow(infoWindow);
    });
}

function addGpxMarkers(map) {
    addGpxMarker(map, "es-4126-050", 48.535361, -122.857658);
    addGpxMarker(map, "es-4126-051", 48.535306, -122.857078);
    addGpxMarker(map, "es-4127-013", 48.535352, -122.857027);
    addGpxMarker(map, "es-4127-017", 48.535497, -122.856477);
    addGpxMarker(map, "es-4126-052", 48.535714, -122.855644);
    addGpxMarker(map, "es-4127-021", 48.535713, -122.855641);
    addGpxMarker(map, "es-4127-025", 48.536609, -122.852502);
    addGpxMarker(map, "es-4127-026", 48.536684, -122.852275);
    addGpxMarker(map, "es-4127-028", 48.536609, -122.851686);
    addGpxMarker(map, "es-4126-061", 48.536358, -122.852775);
    addGpxMarker(map, "es-4127-042", 48.535371, -122.857749);
}
