/**
 * Created by Flavor on 1/10/17.
 */
const app = angular.module('SwimLightingApp', ['ngMaterial']);

app.config(function ($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('yellow')
    .accentPalette('grey');
});

app.controller('SwimLightingCtrl', function ($scope, $mdDialog, $timeout) {

  $scope.title = 'Welcome to Boston';

  $scope.dateTime = {
    date: moment().format('MMMM Do YYYY'),
    time: moment().format('h:mm A')
  };

  $scope.lightingStream = [];

  $scope.showWelcome = function (ev) {
    $mdDialog.show({
      controller: function ($scope, $mdDialog) {
        $scope.modalBtn = 'lighting-welcome-btn';
        $scope.closeModal = function () {
          $scope.modalBtn = 'lighting-welcome-btn-active';
          $timeout(function () {
            $mdDialog.hide();
          }, 2000);
        };
      },
      templateUrl: 'dialog1.tmpl.html',
      targetEvent: ev,
      clickOutsideToClose: false,
      fullscreen: true
    })
  };

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $scope.showWelcome();

  function initialize() {

    var mapOptions = {
      center: {lat: 42.3301, lng: -71.0789},
      zoom: 13,
      styles: map_style,
      disableDefaultUI: true
    };
    var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    var myLayer = new WebGLLayer(map);

    var lightFeaturesIndex = {};
    var lightFeatures = [];
    var color_light = [0.984, 0.949, 0.678];
    var color_dark = [0.404, 0.533, 0.616];

    var lightGeoJSON = {
      type: 'FeatureCollection',
      features: lightFeatures
    };


    function startLayer() {
      myLayer.loadData(lightGeoJSON);
      for (var i = 0; i < lightGeoJSON.features.length; i += 1) {
        var feature = lightGeoJSON.features[i];
        if (feature.properties.illumination > 0) {
          myLayer.changePointColor(i, color_light); //Change color to streetlight yellow
        } else if (feature.properties.illumination == 0) {
          myLayer.changePointColor(i, color_dark); //Change color to midnight blue
        }
      }
      myLayer.start();
      $scope.cancel();
    }

    map.addListener('zoom_changed', function () {
      myLayer.changePointSize(map.getZoom());
    });



    /* flag to indicate google maps is loaded */
    googleMapsLoaded = false;

    /* listen to the tilesloaded event
     if that is triggered, google maps is loaded successfully for sure */
    google.maps.event.addListener(map, 'tilesloaded', function () {
      googleMapsLoaded = true;
      //clear the listener, we only need it once
      google.maps.event.clearListeners(map, 'tilesloaded');

      var lightsSynced = false;
      var lights = Swim.downlinkMap()
        .host('ws://lighting.swim.services/')
        //.host('ws://localhost:9001/')
        .node('lights/boston')
        .lane('lights')
        .didLink(function () {
          console.log('didLink');
        })
        .didSync(function () {
          console.log('didSync');
          if (!lightsSynced) {
            lightsSynced = true;
            startLayer();
          }
        })
        .didUpdate(function (key, newValue) {
          //console.log('light ' + key + ': ' + JSON.stringify(newValue));
          if (!newValue || !newValue.lng || !newValue.lat) {
            return;
          }
          var feature;
          var index = lightFeaturesIndex[key];
          if (index === undefined) {
            index = lightFeatures.length;
            feature = {
              type: 'Feature',
              id: key,
              index: index,
              geometry: {
                type: 'Point',
                coordinates: [newValue.lng, newValue.lat]
              },
              properties: {
                id: key,
                index: index,
                illumination: newValue.illumination
              }
            };

            lightFeatures.push(feature);

            // $scope.lightingStream.push(feature);
            // console.log('$scope.lightingStream', $scope.lightingStream);

            lightFeaturesIndex[key] = index;
          } else {
            if (!lightsSynced) {
              console.log('fakeSync');
              lightsSynced = true;
              startLayer();
            }
            feature = lightFeatures[index];
            feature.properties.illumination = newValue.illumination;
            if (newValue.illumination > 0) {
              myLayer.changePointColor(index, color_light); //Change color to streetlight yellow
            } else if (newValue.illumination == 0) {
              myLayer.changePointColor(index, color_dark); //Change color to midnight blue
            }
          }
        })
        .open();

    });

  }

  google.maps.event.addDomListener(window, 'load', initialize);

});