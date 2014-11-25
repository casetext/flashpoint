
angular.module('angular-fireproof.directives.fpBind', [
  'angular-fireproof.directives.firebase',
  'angular-fireproof.services.status'
])
.directive('fpBind', function() {

  return {

    restrict: 'A',
    scope: true,
    require: '^firebase',
    link: function(scope, el, attrs, firebase) {

      var ref, snap, listener, removeScopeListener;

      scope.$attached = false;
      scope.$syncing = false;


      var setError = function(err) {

        scope.$error = err;
        if (attrs.onError) {
          scope.$evalAsync(attrs.onError);
        }

      };


      scope.$revert = function() {

        if (scope.$attached) {
          scope.$detach();
          scope.$attached = false;
        }

        scope.$attach();

      };


      scope.$sync = function() {

        if (!scope.$syncing) {

          scope.$syncing = true;

          var value = scope[attrs.as || '$val'];
          if (value === undefined) {
            value = null;
          }

          var priority = scope.$priority;
          if (priority === undefined) {
            priority = null;
          }

          if (value !== snap.val() || priority !== snap.getPriority()) {

            ref.setWithPriority(value, priority, function(err) {

              setTimeout(function() { scope.$apply(function() {

                if (err) {
                  setError(err);
                }

              }); }, 0);

            });

          }

        }

      };

      scope.$detach = function() {

        if (listener) {
          ref.off('value', listener);
        }

        if (removeScopeListener) {
          removeScopeListener();
        }

        scope.$attached = false;

      };


      scope.$attach = function() {

        listener = ref.on('value', function(newSnap) {

          setTimeout(function() { scope.$apply(function() {

            snap = newSnap;

            if (!scope.$attached) {
              scope.$attached = true;
            }

            if (removeScopeListener) {
              removeScopeListener();
            }

            scope.$name = snap.name();
            scope.$val = snap.val();
            scope.$priority = snap.getPriority();

            if (attrs.as) {
              scope[attrs.as] = snap.val();
            }

            if (attrs.onLoad) {
              scope.$evalAsync(attrs.onLoad);
            }

            if (scope.$syncing) {
              scope.$syncing = false;

              if (attrs.onSync) {
                scope.$evalAsync(attrs.onSync);
              }

            }

            if (attrs.autosync) {

              var watchExpression = '{ ' +
                'value: ' + (attrs.as || '$val') + ',' +
                'priority: $priority' +
                ' }';

              removeScopeListener = scope.$watch(watchExpression, function() {
                scope.$sync();
              }, true);

            }

          }); }, 0);

        }, function(err) {

          setTimeout(function() { scope.$apply(function() {

            scope.$detach();
            setError(err);

          });

        }); }, 0);

      };


      attrs.$observe('fpBind', function(path) {

        path = path || '';
        if (scope.$attached) {
          scope.$detach();
          scope.$attached = false;
        }

        // If any of the following four conditions arise in the path:
        // 1. The path is the empty string
        // 2. two slashes appear together
        // 3. there's a trailing slash
        // 4. there's a leading slash
        // we assume there's an incomplete interpolation and don't attach
        if (path.length === 0 ||
          path.match(/\/\//) ||
          path.charAt(0) === '/' ||
          path.charAt(path.length-1) === '/') {
          return;
        }

        ref = firebase.root.child(path);
        scope.$attach();

      });

    }

  };

});

