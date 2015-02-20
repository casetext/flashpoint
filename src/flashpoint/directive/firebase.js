
angular.module('flashpoint')
.directive('firebase', function($animate) {

  /**
   * @ngdoc directive
   * @name firebase
   * @description Wires Firebase into an Angular application.
   *
   * The `firebase` directive is an easy way to make the Firebase controller available
   * to enclosing scope, where it is exposed as `fp`.
   *
   * @restrict A
   * @element ANY
   * @scope
   * @param {expression} firebase Full URL to the Firebase, like
   * `https://my-firebase.firebaseio.com`. Interpolatable.
   */

  var attached, attachedUrl;

  function firebasePreLink(scope, el, attrs, fp) {

    var attachToController = function(url) {

      if (attached && url === attachedUrl) {
        // already attached to this path, no action necessary
        return;
      }

      fp.attachFirebase(url);
      attached = true;
      attachedUrl = url;

    };

    if (attrs.firebase) {
      attachToController(attrs.firebase);
    }

    attrs.$observe('firebase', attachToController);

    scope.$watch('fp.connected', function(connected) {

      if (connected === true) {
        $animate.setClass(el, 'fp-connected', 'fp-disconnected');
      } else if (connected === false) {
        $animate.setClass(el, 'fp-disconnected', 'fp-connected');
      } else {
        $animate.setClass(el, [], ['fp-connected', 'fp-disconnected']);
      }

    });

    scope.$watch('fp.auth', function(auth) {

      if (auth === undefined) {
        $animate.setClass(el, [], ['fp-unauthenticated', 'fp-authenticated']);
      } else if (auth === null) {
        $animate.setClass(el, 'fp-unauthenticated', 'fp-authenticated');
      } else {
        $animate.setClass(el, 'fp-authenticated', 'fp-unauthenticated');
      }

    });

    scope.$watch('fp.authError', function(authError) {

      if (authError) {
        $animate.addClass(el, 'fp-auth-error');
      } else {
        $animate.removeClass(el, 'fp-auth-error');
      }

    });

    scope.$watch('fp.accountError', function(accountError) {

      if (accountError) {
        $animate.addClass(el, 'fp-account-error');
      } else {
        $animate.removeClass(el, 'fp-account-error');
      }

    });

  }


  return {

    restrict: 'A',
    scope: true,
    controller: 'FirebaseCtl',
    controllerAs: 'fp',
    priority: 1000,
    link: {
      pre: firebasePreLink
    }

  };

});

