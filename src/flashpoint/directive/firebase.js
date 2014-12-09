
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
   *   <button ng-click="login().then($set('signups', $auth.uid, true))">Sign up!</button>
   * </example>
   *
   * If you want to run the action immediately, you can use e.g. `fp.set(...).now()`.
   * But this is _NOT_ necessary in Angular expressions! Angular already knows
   * to "unwrap" and evaluate the function. So you can do the following:
   *
   * <example firebase="https://my-firebase.firebaseio.com">
   *   <button ng-click="$set('signups', $auth.uid, true)">Sign up!</button>
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
    scope.fp = controller;

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

