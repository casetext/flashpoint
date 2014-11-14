
angular.module('angular-fireproof.directives.firebaseUrl', [
  'angular-fireproof.controllers.FirebaseUrlCtl',
  'angular-fireproof.services.Fireproof'
])
.directive('firebaseUrl', function() {

  return {

    restrict: 'A',
    scope: true,
    controller: 'FirebaseUrlCtl'

  };

});

