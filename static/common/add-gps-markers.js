function addGpxMarker(map, id, lat, lon) {
    const contentString =
        '<div class="gpx-marker">' +
        '<a href="#' + id + '"><img src="' + id + '.jpg" alt=""></a>' +
        '</div>';

    const infoWindow = new google.maps.InfoWindow({
        content: contentString,
        maxWidth: 200,
    });

    const marker = new google.maps.Marker({
        position: { lat: lat, lng: lon },
        map,
        title: "{{id}}",
    });

    infoWindow.open(map, marker);

    return marker;
}
