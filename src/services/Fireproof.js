
angular.module('angular-fireproof')
/**
 * @ngdoc service
 * @name Firebase
 */
.factory('Firebase', function() {
  return Firebase;
})
/**
 * @ngdoc service
 * @name ServerValue
 */
.factory('ServerValue', function(Firebase) {
  return Firebase.ServerValue;
})
/**
 * @ngdoc service
 * @name Fireproof
 */
.factory('Fireproof', function($timeout, $q) {

  Fireproof.setNextTick($timeout);
  Fireproof.bless($q);

  return Fireproof;

});
