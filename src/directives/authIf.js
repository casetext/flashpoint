
angular.module('angular-fireproof.directives.authIf', [
  'angular-fireproof.directives.firebase'
])
.directive('authIf', function() {

  return {

    restrict: 'A',
    transclude: true,
    scope: true,
    template: '<ng-transclude ng-if="$condition()"></ng-transclude>',
    require: '^firebase',

    link: function(scope, el, attrs, firebase) {

      scope.$condition = false;
      firebase.onProfile(profileListener);

      function profileListener() {

        if (attrs.authIf) {

          scope.$condition = scope.$eval(attrs.authIf, {
            $auth: firebase.$auth,
            $profile: firebase.$profile
          });

        } else {

          // by default, we check to see if the user is authed at all.
          scope.$condition = angular.isDefined(firebase.$auth) &&
            firebase.$auth !== null &&
            firebase.$auth.provider !== 'anonymous';

        }

      }

      scope.$on('$destroy', function() {
        firebase.offProfile(profileListener);
      });

    }

  };

});
