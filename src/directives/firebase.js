
angular.module('angular-fireproof.directives.firebase', [
  'angular-fireproof.controllers.FirebaseCtl',
  'angular-fireproof.services.Fireproof'
])
.directive('firebase', function() {

  return {

    restrict: 'A',
    scope: true,
    controller: 'FirebaseCtl'

  };

});

