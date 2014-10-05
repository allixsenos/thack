angular.module('ngAppThack', [])
  .controller('DestinationController', function($scope) {
    navigator.geolocation.getCurrentPosition(function(position) {
      $scope.info = position.coords.latitude + ' X ' + position.coords.longitude;
      $scope.$apply();
    });
  });
