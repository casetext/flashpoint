
angular.module('angular-fireproof')
/**
 * @ngdoc service
 * @name fpBindSyncTimeout
 * @description The amount of time fpBind will wait before a scope value changing
 * and writing the change (to prevent a write catastrophe). Defaults to 250 ms.
 */
.value('fpBindSyncTimeout', 250)
/**
 * @ngdoc directive
 * @name fpBind
 * @description Binds the value of a location in Firebase to local scope,
 * updating it automatically as it changes.
 *
 * Exposes the following variables on local scope:
 *
 * | Variable    | Type             | Details                                                                        |
 * |-------------|------------------|--------------------------------------------------------------------------------|
 * | `$sync`     | {@type function} | Sets the value/priority in Firebase to the value on scope.                     |
 * | `$revert`   | {@type function} | Sets the value/priority on scope to the most recent Firebase snapshot's value. |
 * | `$attach`   | {@type function} | Starts listening to Firebase for changes. Happens by default initially.        |
 * | `$detach`   | {@type function} | Stops listening to Firebase for changes.                                       |
 * | `$name`     | {@type string}   | The last path component of the Firebase location.                              |
 * | `$val`      | {@type *}        | The value in Firebase, or `null` if there isn't one.                           |
 * | `$priority` | {@type *}        | The priority in Firebase, or `null` if there isn't one.                        |
 * | `$attached` | {@type boolean}  | True if the directive is listening to Firebase, false otherwise.               |
 * | `$syncing`  | {@type boolean}  | True if a Firebase operation is in progress, false otherwise.                  |
 * | `$error`    | {@type Error}    | The most recent error returned from Firebase, undefined in non-error cases.    |
 *
 * @restrict A
 * @element ANY
 * @scope
 * @param {expression} fpBind Path to the location in the Firebase, like
 * `favorites/{{ $auth.uid }}/aFew`. Interpolatable.
 * @param {expression} copyTo Path to another Firebase location to write to. Optional.
 * @param {expression} as The name of a variable on scope to bind. So you could do
 * something like
 * `<example fp-bind="users/{{ $auth.uid }}/name" as="name">Your username is {{ name }}</example>`.
 * @param {expression} autosync If this value evaluates on local scope to `true`,
 * the directive will sync to Firebase every time its value changes. When autosync
 * is on, `$sync` is a no-op.
 * @param {expression} onLoad An expression that gets evaluated every time new
 * data comes from Firebase.
 * @param {expression} onSync An expression that gets evaluated every time fpBind
 * successfully sends data to Firebae.
 * @param {expression} onError An expression that gets evaluated when Firebase
 * reports an error (usually related to permissions). The error is available on
 * scope as $error.
 */
.directive('fpBind', function($q, $animate, fpBindSyncTimeout) {

  return {

    restrict: 'A',
    scope: true,
    require: '^firebase',
    link: function(scope, el, attrs, firebase) {

      var ref, snap, listener, removeScopeListener, syncTimeout;

      scope.$attached = false;
      scope.$syncing = false;


      var setError = function(err) {

        $animate.addClass(el, 'fp-error');
        scope.$error = err;
        if (attrs.onError) {
          scope.$evalAsync(attrs.onError);
        }

      };


      var clearError = function() {

        $animate.removeClass(el, 'fp-error');
        delete scope.$error;

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

          if (syncTimeout) {
            clearTimeout(syncTimeout);
          }

          syncTimeout = setTimeout(function() {

            syncTimeout = null;

            var value = scope[attrs.as || '$val'];
            if (value === undefined) {
              value = null;
            }

            var priority = scope.$priority;
            if (priority === undefined) {
              priority = null;
            }

            if (value !== snap.val() || priority !== snap.getPriority()) {

              $animate.addClass(el, 'fp-syncing');
              scope.$syncing = true;

              var fpRef = new Fireproof(ref);

              var promise;
              if (attrs.copyTo) {

                var copyToRef = new Fireproof(firebase.root.child(attrs.copyTo));
                promise = $q.all([
                  copyToRef.setWithPriority(value, priority),
                  fpRef.setWithPriority(value, priority)
                ]);

              } else {
                promise = fpRef.setWithPriority(value, priority);
              }

              promise
              .then(function() {

                scope.$syncing = false;
                $animate.removeClass(el, 'fp-syncing');

                if (attrs.onSync) {
                  scope.$evalAsync(attrs.onSync);
                }

              })
              .catch(function(err) {

                scope.$syncing = false;
                $animate.removeClass(el, 'fp-syncing');

                setError(err);

              });

            }

          }, fpBindSyncTimeout);

        }

      };

      scope.$detach = function() {

        if (listener) {
          ref.off('value', listener);
        }

        if (removeScopeListener) {
          removeScopeListener();
        }

        $animate.removeClass(el, 'fp-attached');
        $animate.removeClass(el, 'fp-syncing');
        scope.$attached = false;

      };


      scope.$attach = function() {

        if (scope.$error) {
          clearError();
        }

        listener = ref.on('value', function(newSnap) {

          if (scope.$error) {
            clearError();
          }

          setTimeout(function() { scope.$apply(function() {

            snap = newSnap;

            if (!scope.$attached) {
              scope.$attached = true;
              $animate.addClass(el, 'fp-attached');
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

        if (scope.$error) {
          clearError();
        }

        path = path || '';
        if (scope.$attached) {
          scope.$detach();
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

