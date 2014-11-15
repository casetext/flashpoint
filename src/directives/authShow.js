
// by default we need this directive to be invisible. write some CSS classes
// to head right here.

(function() {

  var css = '[auth-show]:not(.show) { display:none; }';

  try {

    var head = document.getElementsByTagName('head')[0];
    var s = document.createElement('style');
    s.setAttribute('type', 'text/css');
    if (s.styleSheet) { // IE
      s.styleSheet.cssText = css;
    } else { // others
      s.appendChild(document.createTextNode(css));
    }

    head.appendChild(s);

  } catch(e) {}

})();

angular.module('angular-fireproof.directives.authShow', [
  'angular-fireproof.directives.firebase'
])
.directive('authShow', function() {

  return {

    restrict: 'A',
    require: '^firebase',
    link: function(scope, el, attrs, firebase) {

      firebase.onProfile(profileListener);

      function profileListener() {

        var authOK;
        if (attrs.authShow) {

          authOK = scope.$eval(attrs.authShow, {
            $auth: firebase.auth,
            $profile: firebase.profile
          });

        } else {

          // by default, we check to see if the user is authed at all.
          authOK = angular.isDefined(firebase.$auth) &&
            firebase.auth !== null &&
            firebase.auth.provider !== 'anonymous';

        }

        if (authOK) {
          el.addClass('show');
        } else {
          el.removeClass('show');
        }

      }

      scope.$on('$destroy', function() {
        firebase.offProfile(profileListener);
      });

    }

  };

});
