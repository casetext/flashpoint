
angular.module('flashpoint')
.directive('firebase', function() {

  /**
   * @ngdoc directive
   * @name firebase
   * @description Wires Firebase into an Angular application.
   *
   * `firebase` exposes the following methods and variables on local scope:
   *
   * | Variable           | Type             | Details                                                                         |
   * |--------------------|------------------|---------------------------------------------------------------------------------|
   * | `$auth`            | {@type Object}   | Auth data if the user is logged in, null if not.                                |
   * | `$login`           | {@type Function} | Runs the login handler. Returns a {@type Promise}.                              |
   * | `$logout`          | {@type Function} | Runs the logout handler. Returns a {@type Promise}.                             |
   * | `$val`             | {@type Function} | Evaluates a Firebase value.                                                     |
   * | `$set`             | {@type Function} | Sets a Firebase location to a given value.                                      |
   * | `$setPriority`     | {@type Function} | Sets a Firebase location to a given priority.                                   |
   * | `$setWithPriority` | {@type Function} | Sets a Firebase location to a given value and priority.                         |
   * | `$update`          | {@type Function} | Updates a Firebase location with a given object.                                |
   * | `$remove`          | {@type Function} | Sets a Firebase location to null.                                               |
   * | `$increment`       | {@type Function} | Atomically increments the value at path. Fails for non-numeric non-null values. |
   * | `$decrement`       | {@type Function} | Atomically decrements the value at path. Fails for non-numeric non-null values. |
   *
   * @example
   * `$val` and all succeeding methods take a variable number of path components followed by their
   * necessary arguments (for `$set` and `$update`, a value; for `$setPriority`, a priority; and for
   * `$setWithPriority`, a value and a priority). So you could do the following:
   * `Your assigned seat is {{ $val('seatAssignments', $auth.uid) }}`.
   *
   * `$set` and related methods all return a {@type function} so that you can
   * easily pass them into a promise chain like so:
   *
   * <example firebase="https://my-firebase.firebaseio.com">
   *   <button ng-click="login().then($set('signups', $auth.uid, true))">Sign up!</button>
   * </example>
   *
   * If you wanted to run the action immediately, you can use `$set(...).now()`:
   *
   * <example firebase="https://my-firebase.firebaseio.com">
   *   <button ng-click="$set('signups', $auth.uid, true).now()">Sign up!</button>
   * </example>
   *
   * @restrict A
   * @element ANY
   * @scope
   * @param {expression} firebase Full URL to the Firebase, like
   * `https://my-firebase.firebaseio.com`. Interpolatable.
   * @param {expression} loginHandler A method on local scope that challenges
   * the user for login credentials and returns a {@type Promise} that resolves
   * on login or rejects on failure. Required if you plan to use authentication.
   * @param {expression} logoutHandler A method on local scope that handles logout
   * procedures and returns a {@type Promise} that resolves on success or rejects
   * on failure. By default this just calls `root.unauth()`.
   * @param {expression} onChange An expression that gets evaluated when Firebase
   * sends a new value that we happen to be listening to.
   * @param {expression} onAuthChange An expression that gets evaluated when
   * auth conditions change, because the user logs in or out.
   */

  var attached, attachedUrl;


  var preLink = function(scope, el, attrs, controller) {


    var authHandler = function(authData) {

      setTimeout(function() {

        scope.$apply(function() {

          scope.$auth = authData;

          if (attrs.onAuthChange) {
            scope.$evalAsync(attrs.onAuthChange);
          }

        });

      }, 0);

    };


    var attachToController = function(url) {

      if (attached && url === attachedUrl) {
        // already attached to this path, no action necessary
        return;
      }

      if (controller.root) {

        // detach old auth listener
        controller.root.offAuth(authHandler);

      }

      controller.attachFirebase(url);

      // attach new auth listener
      controller.root.onAuth(authHandler);


      // attach handlers, possibly
      if (attrs.loginHandler) {

        controller.setLoginHandler(function(root, options) {
          return scope.$eval(attrs.loginHandler, { $root: root, $options: options });
        });

      } else {
        // reset to default handler.
        controller.setLoginHandler();
      }


      if (attrs.logoutHandler) {

        controller.setLogoutHandler(function(root, options) {
          return scope.$eval(attrs.logoutHandler, { $root: root, $options: options });
        });

      } else {
        // reset to default handler.
        controller.setLogoutHandler();
      }

      attached = true;
      attachedUrl = url;

    };


    if (attrs.firebase) {
      attachToController(attrs.firebase);
    }

    attrs.$observe('firebase', attachToController);

  };


  return {

    restrict: 'A',
    scope: true,
    controller: 'FirebaseCtl',
    priority: 1000,
    link: {
      pre: preLink
    }

  };

});

