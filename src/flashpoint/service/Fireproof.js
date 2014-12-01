
angular.module('flashpoint')
.factory('Firebase', function() {

/**
 * @ngdoc service
 * @name Firebase
 * @description The Firebase class.
 *
 * The Firebase library exposes this on window by default, but using Angular DI
 * allows it to be mocked or modified if you wish.
 *
 * NB: You should not use this service yourself! Instead, use the firebase
 * directive and write your own directives to require it, then access its
 * `root` Firebase reference.
 *
 * @see {@link FirebaseCtl#cleanup}
 */

  return Firebase;

})
.factory('ServerValue', function(Firebase) {

  /**
   * @ngdoc service
   * @name ServerValue
   * @description The object ordinarily discovered on `Firebase.ServerValue`.
   *
   * Available for convenience.
   * @see {@link Firebase}
   */

  return Firebase.ServerValue;

})
.factory('Fireproof', function($timeout, $q) {

  /**
   * @ngdoc service
   * @name Fireproof
   * @description The Fireproof class, properly configured for use in Angular.
   *
   * "Properly configured" means that $timeout is used for nextTick and
   * Angular's $q is used for promises).
   *
   * NB: You should not use this service yourself! Instead, use the firebase
   * directive and write your own directives to require it, then access its
   * `root` Firebase reference. See {}.
   */

  Fireproof.setNextTick($timeout);
  Fireproof.bless($q);

  return Fireproof;

});
