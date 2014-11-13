
angular.module('angular-fireproof.services.Fireproof', [])
.factory('Firebase', function($window) {
  return $window.Firebase;
})
.factory('Fireproof', function($window, $timeout, $q) {

  $window.Fireproof.setNextTick($timeout);
  $window.Fireproof.bless($q);

  return $window.Fireproof;

});
