
angular.module('flashpoint')
.directive('onAuth', function() {

  /**
   * @ngdoc directive
   * @name onAuth
   * @description Evaluates an Angular expression on changes in authentication status.
   *
   * The `onAuth` directive hooks into Firebase's `onAuth` expression and evaluates
   * the expression you supply every time authentication status against your Firebase
   * changes. This is useful for managing login state. It supplies the special variable
   * `$auth` to your expression.
   *
   * @restrict A
   * @element ANY
   */

  function onAuthPreLink(scope, el, attrs, fp) {

    function authHandler(authData) {

      if (attrs.onAuth) {
        scope.$eval(attrs.onAuth, { $auth: authData });
      }

    }

    fp.onAttach(function(root) {
      root.onAuth(authHandler);
    });

    fp.onDetach(function(root) {
      root.offAuth(authHandler);
    });

  }

  return {
    priority: 750,
    require: '^firebase',
    restrict: 'A',
    link: {
      pre: onAuthPreLink
    }

  };

});
