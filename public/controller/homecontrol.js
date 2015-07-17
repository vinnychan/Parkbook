/**
 * Created by yves on 09/07/15.
 */


var homecontrol = angular.module("parkbook");

homecontrol.controller("AppCtrl", ['$scope', '$http', 'ezfb', function ($scope, $http, ezfb) {
    var url = "http://localhost:3000";
    // url = "https://parkbook.herokuapp.com";

    $scope.savePark = function(newPark) {
        $http.post(url + "/add", {name:newPark}).success(function() {
            loadParks();
        })
    };

    var originalMapOptions = {
        zoom: 12,
        scrollwheel: false,
        center: new google.maps.LatLng(49.246292, -123.116226),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    homeMap = new google.maps.Map(document.getElementById('map'), originalMapOptions);

    // Try HTML5 geolocation
    function checkLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                pos = new google.maps.LatLng(position.coords.latitude,
                    position.coords.longitude);

                var infowindow = new google.maps.InfoWindow({
                    map: $scope.mymap,
                    position: pos,
                    content: 'Your Location'
                });

                $scope.mymap.setCenter(pos);


            }, function () {
                handleNoGeolocation(true);
            });
        } else {
            // Browser doesn't support Geolocation
            handleNoGeolocation(false);
        }
    }


    function loadParks() {
        $http.get(url + "/home").success(function (parks) {
            $scope.parks = parks;

            var mapOptions = {
                zoom: 12,
                scrollwheel: false,
                center: new google.maps.LatLng(49.246292, -123.116226),
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            $scope.mymap = new google.maps.Map(document.getElementById('map'), mapOptions);

            google.maps.event.addDomListener(window, 'load', loadParks);
            checkLocation();
        })
    }

    loadParks();

    /*
     Geolocation error handler
     */
    function handleNoGeolocation(errorFlag) {
        if (errorFlag) {
            var content = 'Error: The Geolocation service failed.';
        } else {
            var content = 'Error: Your browser doesn\'t support geolocation.';
        }

        var options = {
            map: mymap,
            position: new google.maps.LatLng(49.246292, -123.116226),
            content: content
        };

        var infowindow = new google.maps.InfoWindow(options);
        map.setCenter(options.position);
    }




    //this function is called inside HTML
    //the http call is tagged with "/download" and sent to server.js
    //server.js calls the app.get() with the "/download" tag
    $scope.importParks = function() {
        console.log("clicked import");
        $http.get(url + "/download").success(function() {
            console.log("inside success");
            loadParks();
        })
    };

    var prev_infowindow =false;
    var pos;
    var markersArray = [];
    var latitude;
    var longitude;
    function clearOverlays() {
        for (var i = 0; i < markersArray.length; i++) {
            markersArray[i].setMap(null);
        }
        markersArray.length = 0;
    }

    //Make Info windows for Maps
    function makeInfoWindow(map, infowindow, marker) {
        return function() {
            if( prev_infowindow ) {
                prev_infowindow.close();
            }
            prev_infowindow = infowindow;
            infowindow.open(map, marker)
        };
    }

    //Make the markers for maps
    function setMarkers(parkObjects) {
        for (var i = 0; i < parkObjects.length; i++) {

            var infowindow = [];
            var marker = [];

            //var contentString = '<p><b>' + parkObjects[i].name + '</b></p>' +
            //    '<p>' + parkObjects[i].streetNumber + " " + parkObjects[i].streetName + '</p>' +
            //    '<p><a href="#/park/' + parkObjects[i].name + '">' + "View this park!" +'</a></p>' +
            //    '<p id="routeHere"><a href>' + "route to here!" +'</a></p>';

            var $infoWindowContent = $([
                '<div class="infoWindowContent">',
                '<p><b>' + parkObjects[i].name + '</b></p>',
                '<p>' + parkObjects[i].streetNumber + " " + parkObjects[i].streetName + '</p>',
                '<p><a class="btn btn-dark" href="#/park/' + parkObjects[i].name + '">' + "View this park!" +'</a></p>',
                '<button class="btn btn-dark routeHere">Route to here</button>',
                '</div>'
            ].join(''));
            $infoWindowContent.find(".routeHere").on('click', function() {
                console.log("whats up my man");
                calcRoute();
            });

            infowindow[i] = new google.maps.InfoWindow();
            infowindow[i].setContent($infoWindowContent.get(0));

            //infowindow[i] = new google.maps.InfoWindow({content: contentString});


            marker[i] = new google.maps.Marker({

                map: $scope.mymap,
                animation: google.maps.Animation.DROP,
                position: new google.maps.LatLng(parkObjects[i].lat, parkObjects[i].lon),
                title: parkObjects[i].name
            });

            google.maps.event.addListener(marker[i], "click", function () {
                latitude = this.position.lat();
                longitude = this.position.lng();
                //alert(this.position);
                console.log(latitude);
                console.log(longitude);
                console.log(pos);
                //calcRoute();
            }); //end addListener

            google.maps.event.addListener(marker[i], 'click', makeInfoWindow($scope.mymap, infowindow[i], marker[i]));
            markersArray.push(marker[i]);
        }
    }

    //Find parks based on the user's search
    $scope.findPark = function(parkName) {
        clearOverlays();
        directionsDisplay.setMap(homeMap);
        console.log(parkName);
        $http.post(url + "/search" + parkName, {name: parkName}).success(function(park) {

            //if (park.length == 0) {
            //    alert("Sorry! We couldn't find a park named " + parkName);
            //    return;
            //}

            $scope.parksSearched = park;

            try {
                setMarkers(park);
                $scope.mymap.panTo(markersArray[0].getPosition());
            } catch(err) {
                alert("Sorry! We couldn't find a park named " + parkName);
            }

        })
    };

    $scope.findAllParks = function() {
        directionsDisplay.setMap(homeMap);
        $http.get(url + "/searchall");
    };

    $scope.findRandomPark = function() {
        directionsDisplay.setMap(homeMap);
        $http.post(url + "/adventure").success(function(parks) {
            clearOverlays();

            $scope.allParks = parks;
            var randNum = Math.floor((Math.random() * parks.length - 1));
            var randPark = [parks[randNum]];
            $scope.parksSearched = randPark;

            setMarkers(randPark);
            $scope.mymap.panTo(markersArray[0].getPosition());

        });
    };

    $scope.findClosestPark = function() {
        console.log("ssup jr");
        directionsDisplay.setMap(homeMap);

            var parkLat = [];
            var parkLon = [];
            var currentLat;
            var currentLon;
            var distanceToParks = [];
            var closestPark = [];




            function onPositionUpdate(position)
            {
                currentLat = position.coords.latitude;
                currentLon = position.coords.longitude;

                $http.get(url + "/home").success(function(parks) {
                    clearOverlays();
                    console.log("ssup jr2");
                    console.log(parks[3]);
                    for(var w = 0; w < parks.length; w++) {
                        parkLat[w] = parks[w].lat;
                        parkLon[w] = parks[w].lon;
                        distanceToParks[w] = $scope.getDistance(currentLat, currentLon, parkLat[w], parkLon[w]);
                    }
                    //console.log(currentLat, currentLon);
                    console.log(parkLat[3], parkLon[3]);
                    console.log(distanceToParks[5], distanceToParks[6]);

                    var closestParkIndex = distanceToParks.indexOf(Math.min.apply(Math, distanceToParks));
                    console.log(closestParkIndex);
                    closestPark[0] = parks[closestParkIndex];
                    console.log(closestPark);
                    $scope.parksSearched = closestPark;

                    setMarkers(closestPark);
                    //setMarkers(closestPark[0].lat)
                    $scope.mymap.panTo(closestPark.getPosition());


                });
            }

            if(navigator.geolocation)
                navigator.geolocation.getCurrentPosition(onPositionUpdate);
            else
                alert("navigator.geolocation is not available");
    };




    var directionsDisplay = new google.maps.DirectionsRenderer();
    var directionsService = new google.maps.DirectionsService();


    function calcRoute() {
        directionsDisplay.setMap($scope.mymap);
        var h2 = new google.maps.LatLng(latitude, longitude);
        console.log(h2);
        var request = {
            origin:pos,
            destination:h2,
            travelMode: google.maps.TravelMode.WALKING
        };
        directionsService.route(request, function(result, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(result);
            }
        });
    }

    $scope.getDistance = function(lat1, lon1, lat2, lon2, unit) {
        var radlat1 = Math.PI * lat1/180;
        var radlat2 = Math.PI * lat2/180;
        var radlon1 = Math.PI * lon1/180;
        var radlon2 = Math.PI * lon2/180;
        var theta = lon1-lon2;
        var radtheta = Math.PI * theta/180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit=="K") { dist = dist * 1.609344; }
        if (unit=="N") { dist = dist * 0.8684; }
        return dist;
    };

    $scope.goToPark = function(parkID) {
        console.log("going to park");
        $http.get(url + "/views/park.html", {_id:parkID}).success(function() {
            console.log("inside success of go to park");
        })
    };

}]);