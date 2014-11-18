
angular.module('angular-fireproof.directives.authClick', [
  'angular-fireproof.directives.firebase'
])
.directive('authClick', function($log) {

  return {
    restrict: 'A',
    require: '^firebase',
    link: function(scope, el, attrs, firebase) {

      var authOK = false;

      scope.$on('angular-fireproof:profile', function() {

        if (attrs.authCondition) {

          authOK = scope.$eval(attrs.authCondition, {
            $auth: firebase.$auth,
            $profile: firebase.$profile
          });

        } else {

          // by default, we check to see if the user is authed at all.
          authOK = angular.isDefined(firebase.$auth) &&
            firebase.$auth !== null &&
            firebase.$auth.provider !== 'anonymous';

        }

      });

      el.on('click', function() {

        if (authOK) {

          // auth check passed, perform the action
          scope.$eval(attrs.authClick, {
            $auth: firebase.$auth,
            $user: firebase.$user
          });

        } else {

          // Perform login check, then the action if it passes.
          firebase.login()
          .then(function() {

            // auth check passed, perform the action
            scope.$eval(attrs.authClick, {
              $auth: firebase.$auth,
              $user: firebase.$user
            });

          }, function(err) {

            // auth check FAILED, call the error handler if it exists.
            $log.debug(err);
            if (attrs.onAuthError) {
              scope.$eval(attrs.onAuthError, { $error: err });
            }

          });

        }

      });

    }

  };

});
