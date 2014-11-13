
angular.module('angular-fireproof.directives.firebaseUrl', [
  'angular-fireproof.services.Fireproof'
])
.directive('firebaseUrl', function(Firebase, Fireproof) {

  return {

    restrict: 'A',
    scope: true,
    priority: 10,
    link: { pre: function(scope, el, attrs) {

      scope.$fireproof = new Fireproof(new Firebase(attrs.firebaseUrl));
      attrs.$observe('firebaseUrl', function() {
        scope.$fireproof = new Fireproof(new Firebase(attrs.firebaseUrl));
      });

    }}

  };

});

