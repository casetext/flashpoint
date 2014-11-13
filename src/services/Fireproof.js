
angular.module('angular-fireproof.services.Fireproof', [])
.factory('Firebase', function() {
  return Firebase;
})
.factory('Fireproof', function($timeout, $q) {

  Fireproof.setNextTick($timeout);
  Fireproof.bless($q);

  return Fireproof;

});
