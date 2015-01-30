
angular.module('flashpoint')
.directive('onAuth', function() {

  function onAuthPreLink(scope, el, attrs, fp) {

    function authHandler(authData) {

      if (attrs.onAuth) {
        scope.$eval(attrs.onAuth, { $auth: authData });
      }

    }

    if (fp.root) {
      fp.root.onAuth(authHandler);
    }

    scope.$on('fpAttach', function(root) {
      root.onAuth(authHandler);
    });

    scope.$on('fpDetach', function(root) {
      root.offAuth(authHandler);
    });

  }

  return {
    priority: 750,
    require: '^firebase',
    link: {
      pre: onAuthPreLink
    }

  };

});
