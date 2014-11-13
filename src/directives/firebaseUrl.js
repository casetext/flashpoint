
angular.module('angular-fireproof.directives.firebaseUrl', [
  'angular-fireproof.services.Fireproof'
])
.directive('firebaseUrl', function(Firebase, Fireproof) {

  return {

    restrict: 'A',
    scope: true,
    priority: 10,
    link: { pre: function(scope, el, attrs) {

      var authHandler = function(authData) {

        scope.$auth = authData;
        if (attrs.onAuth) {
          scope.$eval(attrs.onAuth, { '$auth': authData });
        }

      };


      var attachFireproof = function() {

        if (scope.$fireproof) {
          scope.$fireproof.offAuth(authHandler);
        }

        scope.$fireproof = new Fireproof(new Firebase(attrs.firebaseUrl));
        scope.$fireproof.onAuth(authHandler);

      };


      attrs.$observe('firebaseUrl', attachFireproof);
      if (attrs.firebaseUrl) {
        attachFireproof();
      }

      scope.$on('$destroy', function() {

        // detach onAuth listener.
        scope.$fireproof.offAuth(authHandler);

      });

    }}

  };

});

