/**
 * Created by Flavor on 1/10/17.
 */
const app = angular.module('SwimLightingApp', ['ngMaterial']);

app.config(function($mdThemingProvider) {
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

  $scope.showAdvanced = function(ev) {
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'dialog1.tmpl.html',
      targetEvent: ev,
      clickOutsideToClose: false,
      fullscreen: true
    })
      .then(function(answer) {
        $scope.status = 'You said the information was "' + answer + '".';
      }, function() {
        $scope.status = 'You cancelled the dialog.';
      });
  };

  function DialogController($scope, $mdDialog) {

    $scope.modalBtn = 'lighting-welcome-btn';

    $scope.closeModal = function() {

      $scope.modalBtn = 'lighting-welcome-btn-active';

      $timeout(function () {
        $mdDialog.hide();
      }, 2000);
    };
  }

  // $scope.showAdvanced();
  
});