
angular.module('angular-fireproof.services.Fireproof', [])
.factory('Firebase', function() {
  return Firebase;
})
.factory('ServerValue', function(Firebase) {
  return Firebase.ServerValue;
})
.factory('Fireproof', function($timeout, $q) {

  Fireproof.setNextTick($timeout);
  Fireproof.bless($q);

  return Fireproof;

});
