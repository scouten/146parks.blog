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
}
