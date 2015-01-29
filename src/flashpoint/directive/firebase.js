
angular.module('flashpoint')
.directive('firebase', function() {

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
   * <example firebase="https://my-firebase.firebaseio.com">
   *   <button ng-disabled='fp.auth === null' ng-click="fp.set('signups', $auth.uid, true)">Sign up!</button>
   * </example>
   *
   *
   * @restrict A
   * @element ANY
   * @scope
   * @param {expression} firebase Full URL to the Firebase, like
   * `https://my-firebase.firebaseio.com`. Interpolatable.
   * @param {expression} challenge Expression to evaluate when fp.challenge() is called
   * somewhere. This expression should evaluate to a promise that resolves on
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

