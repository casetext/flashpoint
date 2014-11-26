
angular.module('angular-fireproof.directives.firebase', [
  'angular-fireproof.controllers.FirebaseCtl',
  'angular-fireproof.services.Fireproof'
])
.directive('firebase', function() {

  return {

    restrict: 'A',
    scope: true,
    controller: 'FirebaseCtl',
    link: function(scope, el, attrs, firebase) {

      var watchers = {},
        values = {};


      var validatePath = function(pathParts) {

        // check the arguments
        var path = pathParts.join('/');

        if (pathParts.length === 0 || path === '' ||
          pathParts.indexOf(null) !== -1 || pathParts.indexOf(undefined) !== -1) {

          // if any one of them is null/undefined, this is not a valid path
          return null;

        } else {
          return path;
        }

      };


      scope.$val = function() {

        var path = validatePath(Array.prototype.slice.call(arguments, 0));
        if (!path) {
          return;
        }

        if (!watchers[path]) {

          values[path] = null;
          watchers[path] = firebase.root.child(path)
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

        var closure = function() {

          if (!path) {
            return;
          }

          return new Fireproof(firebase.root).child(path).set(value);

        };

        closure.now = function() {
          return closure();
        };

        return closure;

      };


      scope.$setWithPriority = function() {

        // check the arguments
        var args = Array.prototype.slice.call(arguments, 0),
          priority = args.pop(),
          value = args.pop(),
          path = validatePath(args);

        var closure = function() {

          if (!path) {
            return;
          }

          return new Fireproof(firebase.root).child(path)
          .setWithPriority(value, priority);

        };

        closure.now = function() {
          return closure();
        };

      };


      scope.$update = function() {

        // check the arguments
        var args = Array.prototype.slice.call(arguments, 0),
          value = args.pop(),
          path = validatePath(args);

        var closure = function() {

          if (!path) {
            return;
          }

          return new Fireproof(firebase.root).child(path).update(value);

        };

        closure.now = function() {
          return closure();
        };

        return closure;

      };


      scope.$on('$destroy', function() {

        // remove all listeners
        angular.forEach(watchers, function(watcher, path) {
          firebase.root.child(path).off('value', watcher);
        });

      });

    }

  };

});

