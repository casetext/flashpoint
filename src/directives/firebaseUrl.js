
angular.module('angular-fireproof.directives.firebaseUrl', [
  'angular-fireproof.services.Fireproof'
])
.directive('firebaseUrl', function(Firebase, Fireproof, $rootScope) {

  return {

    restrict: 'A',
    scope: true,
    priority: 10,
    link: { pre: function(scope, el, attrs) {

      var isRootScope = false;

      var authHandler = function(authData) {

        scope.$auth = authData;
        if (isRootScope) {
          $rootScope.$auth = authData;
        }

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

        // does rootScope have a Fireproof yet? if not, we're it
        if (!$rootScope.$fireproof) {
          isRootScope = true;
        }

        if (isRootScope) {
          $rootScope.$fireproof = scope.$fireproof;
        }

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

