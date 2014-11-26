/**
 * @ngdoc module:angular-fireproof.directives.firebase
 */
angular.module('angular-fireproof.directives.firebase', [
  'angular-fireproof.controllers.FirebaseCtl',
  'angular-fireproof.services.Fireproof'
])
/**
 * @ngdoc directive
 * @name angular-fireproof.directives.firebase:firebase
 * @description Exposes the following variables on local scope:
 *
 * | Variable           | Type             | Details                                                   |
 * |--------------------|------------------|-----------------------------------------------------------|
 * | `$auth`            | {@type object}   | Auth data if the user is logged in, null if not.          |
 * | `$login`           | {@type function} | Runs the login handler. Returns a {@type Promise}.        |
 * | `$logout`          | {@type function} | Runs the logout handler. Returns a {@type Promise}.       |
 * | `$val`             | {@type function} | Evaluates a Firebase value.                               |
 * | `$set`             | {@type function} | Sets a Firebase location to a given value.                |
 * | `$setPriority`     | {@type function} | Sets a Firebase location to a given priority.             |
 * | `$setWithPriority` | {@type function} | Sets a Firebase location to a given value and priority.   |
 * | `$update`          | {@type function} | Updates a Firebase location with a given object.          |
 * | `$remove`          | {@type function} | Sets a Firebase location to null.                         |
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
.directive('firebase', function() {


  function validatePath(pathParts) {

    // check the arguments
    var path = pathParts.join('/');

    if (pathParts.length === 0 || path === '' ||
      pathParts.indexOf(null) !== -1 || pathParts.indexOf(undefined) !== -1) {

      // if any one of them is null/undefined, this is not a valid path
      return null;

    } else {
      return path;
    }

  }


  function makeClosure(fn) {

    var closure = function() {
      return fn();
    };

    closure.now = function() {
      return closure();
    };

    return closure;

  }


  return {

    restrict: 'A',
    scope: true,
    controller: 'FirebaseCtl',
    link: { pre: function(scope, el, attrs, controller) {

      var watchers = {},
        values = {};


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

      };

      // attach authentication methods from controller to scope
      scope.$auth = null;
      scope.$login = controller.login;
      scope.$logout = controller.logout;

      scope.$val = function() {

        var path = validatePath(Array.prototype.slice.call(arguments, 0));
        if (!path) {
          return;
        }

        if (!values.hasOwnProperty(path)) {
          values[path] = null;
        }

        if (!watchers[path]) {

          watchers[path] = controller.root.child(path)
          .on('value', function(snap) {

            setTimeout(function() {

              scope.$apply(function() {

                values[path] = snap.val();

                if (attrs.onChange) {
                  scope.$eval(attrs.onChange, { $path: path });
                }

              });

            }, 0);

          });

        }

        return values[path];

      };


      scope.$set = function() {

        // check the arguments
        var args = Array.prototype.slice.call(arguments, 0),
          value = args.pop(),
          path = validatePath(args);

        return makeClosure(function() {
          return new Fireproof(controller.root).child(path).set(value);
        });

      };


      scope.$setPriority = function() {

        // check the arguments
        var args = Array.prototype.slice.call(arguments, 0),
          priority = args.pop(),
          path = validatePath(args);

        return makeClosure(function() {
          return new Fireproof(controller.root).child(path).setPriority(priority);
        });

      };


      scope.$setWithPriority = function() {

        // check the arguments
        var args = Array.prototype.slice.call(arguments, 0),
          priority = args.pop(),
          value = args.pop(),
          path = validatePath(args);

        return makeClosure(function() {

          return new Fireproof(controller.root).child(path)
          .setWithPriority(value, priority);

        });

      };


      scope.$update = function() {

        // check the arguments
        var args = Array.prototype.slice.call(arguments, 0),
          value = args.pop(),
          path = validatePath(args);

        return makeClosure(function() {
          return new Fireproof(controller.root).child(path).update(value);
        });

      };


      scope.$remove = function() {

        // check the arguments
        var args = Array.prototype.slice.call(arguments, 0),
          path = validatePath(args);

        return makeClosure(function() {
          return new Fireproof(controller.root).child(path).remove();
        });

      };


      if (attrs.firebase) {
        attachToController(attrs.firebase);
      }
      attrs.$observe('firebase', attachToController);


      scope.$on('$destroy', function() {

        // remove all listeners
        angular.forEach(watchers, function(watcher, path) {
          controller.root.child(path).off('value', watcher);
        });

        // shut down controller
        controller.cleanup();

      });

    }}

  };

});

