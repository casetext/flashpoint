
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
        values = {},
        arrayWatchers = {},
        arrays = {};


      scope.$val = function() {

        // check the arguments
        var args = Array.prototype.slice(arguments, 0),
          path = args.join('/');
          console.log(path);
        if (args.length === 0 || path === '' ||
          args.indexOf(null) !== -1 || args.indexOf(undefined) !== -1) {

          // if any one of them is null/undefined, this is not a valid path
          return;

        }

        if (!watchers[path]) {

          values[path] = null;
          watchers[path] = firebase.root.child(path)
          .on('value', function(snap) {

            scope.$apply(function() {
              values[path] = snap.val();
            });

          });

        }

        return values[path];

      };


      scope.$array = function() {

        // check the arguments
        var args = Array.prototype.slice(arguments, 0);
        if (args.indexOf(null) !== -1 || args.indexOf(undefined) !== -1) {

          // if any one of them is null/undefined, this is not a valid path
          return;

        }

        var path = args.join('/');

        if (!arrayWatchers[path]) {

          arrays[path] = [];
          arrayWatchers[path] = firebase.root.child(path)
          .on('value', function(snap) {

            scope.$apply(function() {

              // iterate the children in priority order and push them on the array.
              snap.forEach(function(child) {
                arrays[path].push(child.val());
              });


            });

          });

        }

        return arrays[path];

      };


      scope.$on('$destroy', function() {

        // remove all listeners
        angular.forEach(watchers, function(watcher, path) {
          firebase.root.child(path).off('value', watcher);
        });

        angular.forEach(arrayWatchers, function(watcher, path) {
          firebase.root.child(path).off('value', watcher);
        });

      });

    }

  };

});

