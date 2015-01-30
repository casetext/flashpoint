
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
   * @example
   * `fp.val` and all succeeding methods take a variable number of path components followed by their
   * necessary arguments (for `fp.set` and `fp.update`, a value; for `fp.setPriority`, a priority; and for
   * `fp.setWithPriority`, a value and a priority). So you could do the following:
   * `Your assigned seat is {{ fp.val('seatAssignments', fp.auth.uid) }}`.
   *
   * `fp.set` and related methods all return a closure {@type function} so that you can
   * easily pass them into a promise chain like so:
   *
   * <example firebase="https://my-firebase.firebaseio.com" firebase-auth="auth">
   *   <button ng-disabled='auth === null' ng-click="fp.set('signups', auth.uid, true)">Sign up!</button>
   * </example>
   *
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

    scope.fp = fp;

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

  }


  return {

    restrict: 'A',
    scope: true,
    controller: 'FirebaseCtl',
    priority: 1000,
    link: {
      pre: firebasePreLink
    }

  };

});

