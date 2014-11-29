
(function (root, factory) {

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['angular', 'firebase', 'fireproof'], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    factory(require('angular'), require('firebase'), require('fireproof'));
  } else {
    // Browser globals (root is window)
    factory(root.angular, root.Firebase, root.Fireproof);
  }

}(this, function (angular, Firebase, Fireproof) {

  'use strict';
    
  /**
   * @ngdoc module
   * @name angular-fireproof
   */
  angular.module('angular-fireproof', []);
  
  
  angular.module('angular-fireproof')
  .directive('firebase', function($q, _firebaseStatus) {
  
    /**
     * @ngdoc directive
     * @name firebase
     * @description Exposes the following variables on local scope:
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
  
    var preLink = function(scope, el, attrs, controller) {
  
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
  
          var id = _firebaseStatus.start(controller.root.child(path), 'read');
  
          watchers[path] = controller.root.child(path)
          .on('value', function(snap) {
  
            setTimeout(function() {
  
              scope.$apply(function() {
  
                if (id) {
                  _firebaseStatus.finish(id);
                  id = null;
                }
  
                values[path] = snap.val();
  
                if (attrs.onChange) {
                  scope.$eval(attrs.onChange, { $path: path });
                }
  
              });
  
            }, 0);
  
          }, function(err) {
  
            if (id) {
              _firebaseStatus.finish(id, err);
              id = null;
            }
  
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
  
          var id = _firebaseStatus.start(controller.root.child(path), 'set');
          return new Fireproof(controller.root).child(path).set(value)
          .finally(function(err) {
            _firebaseStatus.finish(id, err);
          });
  
        });
  
      };
  
  
      scope.$setPriority = function() {
  
        // check the arguments
        var args = Array.prototype.slice.call(arguments, 0),
          priority = args.pop(),
          path = validatePath(args);
  
        return makeClosure(function() {
  
          var id = _firebaseStatus.start(controller.root.child(path), 'setPriority');
          return new Fireproof(controller.root).child(path).setPriority(priority)
          .finally(function(err) {
            _firebaseStatus.finish(id, err);
          });
  
        });
  
      };
  
  
      scope.$setWithPriority = function() {
  
        // check the arguments
        var args = Array.prototype.slice.call(arguments, 0),
          priority = args.pop(),
          value = args.pop(),
          path = validatePath(args);
  
        return makeClosure(function() {
  
          var id = _firebaseStatus.start(controller.root.child(path), 'setWithPriority');
          return new Fireproof(controller.root).child(path)
          .setWithPriority(value, priority)
          .finally(function(err) {
            _firebaseStatus.finish(id, err);
          });
  
        });
  
      };
  
  
      scope.$update = function() {
  
        // check the arguments
        var args = Array.prototype.slice.call(arguments, 0),
          value = args.pop(),
          path = validatePath(args);
  
        return makeClosure(function() {
  
          var id = _firebaseStatus.start(controller.root.child(path), 'update');
          return new Fireproof(controller.root).child(path).update(value)
          .finally(function(err) {
            _firebaseStatus.finish(id, err);
          });
  
        });
  
      };
  
  
      scope.$remove = function() {
  
        // check the arguments
        var args = Array.prototype.slice.call(arguments, 0),
          path = validatePath(args);
  
        return makeClosure(function() {
  
          var id = _firebaseStatus.start(controller.root.child(path), 'remove');
          return new Fireproof(controller.root).child(path).remove()
          .finally(function(err) {
            _firebaseStatus.finish(id, err);
          });
  
        });
  
      };
  
  
      scope.$increment = function() {
  
        // check the arguments
        var args = Array.prototype.slice.call(arguments, 0),
          path = validatePath(args);
  
        return makeClosure(function() {
  
          var id = _firebaseStatus.start(controller.root.child(path), 'increment');
          return new Fireproof(controller.root).child(path)
          .transaction(function(val) {
  
            if (angular.isNumber(val)) {
              return val + 1;
            } else if (val === null) {
              return 1;
            } else {
              return; // abort transaction
            }
  
          })
          .then(function(result) {
  
            if (!result.committed) {
              return $q.reject(new Error('Cannot increment the object at ' + path));
            }
  
          })
          .finally(function(err) {
            _firebaseStatus.finish(id, err);
          });
  
        });
  
      };
  
  
      scope.$decrement = function() {
  
        // check the arguments
        var args = Array.prototype.slice.call(arguments, 0),
          path = validatePath(args);
  
        return makeClosure(function() {
  
          var id = _firebaseStatus.start(controller.root.child(path), 'decrement');
          return new Fireproof(controller.root).child(path)
          .transaction(function(val) {
  
            if (angular.isNumber(val)) {
              return val - 1;
            } else if (val === null) {
              return 0;
            } else {
              return; // abort transaction
            }
  
          })
          .then(function(result) {
  
            if (!result.committed) {
              return $q.reject(new Error('Cannot decrement the object at ' + path));
            }
  
          })
          .finally(function(err) {
            _firebaseStatus.finish(id, err);
          });
  
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
  
    };
  
  
    return {
  
      restrict: 'A',
      scope: true,
      controller: 'FirebaseCtl',
      link: {
        pre: preLink
      }
  
    };
  
  });
  
  
  
  angular.module('angular-fireproof')
  /**
   * @ngdoc service
   * @name fpBindSyncTimeout
   * @description The amount of time fpBind will wait before a scope value changing
   * and writing the change (to prevent a write catastrophe). Defaults to 250 ms.
   */
  .value('fpBindSyncTimeout', 250)
  .directive('fpBind', function($q, $animate, fpBindSyncTimeout) {
  
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
  
  
  
  angular.module('angular-fireproof')
  .directive('fpPage', function($q, Fireproof, $animate) {
  
    /**
     * @ngdoc directive
     * @name fpPage
     * @description Pages over the keys at a Firebase location.
     *
     * Exposes the following variables on local scope:
     *
     * | Variable       | Type                 | Details                                                    |
     * |----------------|----------------------|------------------------------------------------------------|
     * | `$next`        | {@type function}     | Fetches the next set of values into scope.                 |
     * | `$previous`    | {@type function}     | Fetches the previous set of values into scope.             |
     * | `$reset`       | {@type function}     | Starts again at the beginning.                             |
     * | `$keys`        | {@type Array.string} | The keys in the current page.                              |
     * | `$values`      | {@type Array.*}      | The values in the current page.                           |
     * | `$priorities`  | {@type Array.*}      | The priorities in the current page.                        |
     * | `$hasNext`     | {@type boolean}      | True if there are more values to page over.                |
     * | `$hasPrevious` | {@type boolean}      | True if there are previous values to page back over again. |
     * | `$paging`      | {@type boolean}      | True if a paging operation is currently in progress.       |
     * | `$pageNumber`  | {@type number}       | The current page number of results.                        |
     * | `$error`       | {@type Error}        | The most recent error returned from Firebase or undefined. |
     *
     *
     * @restrict A
     * @element ANY
     * @scope
     * @param {expression} fpPage Path to the location in the Firebase, like
     * `favorites/{{ $auth.uid }}`. Interpolatable.
     * @param {expression} as The name of a variable on scope to bind. So you could do
     * something like
     * `<example fp-page="users/{{ $auth.uid }}" as="users">
     *   <ul>
     *     <li ng-repeat="user in users"> {{ user.name }} </li>
     *   </ul>
     * </example>`
     * @param {expression} onPage An expression that gets evaluated when a new page
     * is available.
     * @param {expression} onError An expression that gets evaluated when Firebase
     * returns an error.
     * @param {expression} limit The count of objects in each page.
     */
  
    return {
  
      restrict: 'A',
      scope: true,
      require: '^firebase',
      link: function(scope, el, attrs, firebase) {
  
        var ref, pager;
  
        var setPage = function(snaps) {
  
          $animate.removeClass(el, 'fp-paging');
          scope.$paging = false;
  
          scope.$hasPrevious = scope.$pageNumber > 1;
          scope.$hasNext = (snaps.length === parseInt(attrs.limit));
  
          scope.$keys = snaps.map(function(snap) {
            return snap.name();
          });
  
          scope.$values = snaps.map(function(snap) {
            return snap.val();
          });
  
          scope.$priorities = snaps.map(function(snap) {
            return snap.getPriority();
          });
  
          if (attrs.as) {
            scope[attrs.as] = scope.$values;
          }
  
          if (attrs.onPage) {
            scope.$evalAsync(attrs.onPage);
          }
  
        };
  
        var handleError = function(err) {
  
          $animate.removeClass(el, 'fp-paging');
          scope.$paging = false;
  
          $animate.addClass(el, 'fp-error');
          scope.$error = err;
          if (attrs.onError) {
            scope.$evalAsync(attrs.onError);
          }
  
        };
  
        scope.$next = function() {
  
          if (pager && !scope.$paging && scope.$hasNext) {
  
            $animate.addClass(el, 'fp-paging');
            scope.$paging = true;
            return pager.next(parseInt(attrs.limit) || 5)
            .then(function(result) {
  
              scope.$pageNumber++;
              return result;
  
            })
            .then(setPage, handleError);
  
          } else if (!angular.isDefined(pager)) {
            return $q.reject(new Error('Pager does not exist. Has fp-page been set yet?'));
          }
  
        };
  
        scope.$previous = function() {
  
          if (pager && !scope.$paging && scope.$hasPrevious) {
  
            $animate.addClass(el, 'fp-paging');
            scope.$paging = true;
            return pager.previous(parseInt(attrs.limit) || 5)
            .then(function(result) {
  
              scope.$pageNumber--;
              return result;
  
            })
            .then(setPage, handleError);
  
          } else if (!angular.isDefined(pager)) {
            return $q.reject(new Error('Pager does not exist. Has fp-page been set yet?'));
          }
  
        };
  
        scope.$reset = function() {
  
          $animate.removeClass(el, 'fp-paging');
          $animate.removeClass(el, 'fp-error');
  
          delete scope.$error;
          scope.$pageNumber = 0;
          scope.$hasNext = true;
          scope.$hasPrevious = false;
          scope.$paging = false;
  
          pager = new Fireproof.Pager(new Fireproof(ref));
          return scope.$next();
  
        };
  
        attrs.$observe('fpPage', function(path) {
  
          path = path || '';
  
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
          scope.$reset();
  
        });
  
      }
  
    };
  
  });
  
  
  
  angular.module('angular-fireproof')
  .factory('Firebase', function() {
  
  /**
   * @ngdoc service
   * @name Firebase
   * @description The Firebase class. The Firebase library exposes this on window
   * by default, but using Angular DI allows it to be mocked or modified if
   * you wish.
   * NB: You should not use this service yourself! Instead, use the firebase
   * directive and write your own directives to require it, then access its
   * `root` Firebase reference. See {}.
   * @see {@link https://firebase.com}
   */
  
    return Firebase;
  
  })
  .factory('ServerValue', function(Firebase) {
  
    /**
     * @ngdoc service
     * @name ServerValue
     * @description The object ordinarily discovered on `Firebase.ServerValue`.
     * Available for convenience.
     */
    return Firebase.ServerValue;
  
  })
  .factory('Fireproof', function($timeout, $q) {
  
    /**
     * @ngdoc service
     * @name Fireproof
     * @description The Fireproof class, properly configured for use in Angular
     * (meaning that $timeout is used for nextTick and Angular's $q is used
     * for promises).
     * NB: You should not use this service yourself! Instead, use the firebase
     * directive and write your own directives to require it, then access its
     * `root` Firebase reference. See {}.
     */
    Fireproof.setNextTick($timeout);
    Fireproof.bless($q);
  
    return Fireproof;
  
  });
  
  
  angular.module('angular-fireproof')
  .service('_firebaseStatus', function(
    $timeout,
    $document,
    $animate,
    $rootScope,
    $log
  ) {
  
    var service = this;
  
    function reset() {
  
      service.operationCount = 0;
      service.operations = {
        'read': {},
        'transaction': {},
        'set': {},
        'setWithPriority': {},
        'setPriority': {},
        'update': {},
        'remove': {},
        'increment': {},
        'decrement': {}
      };
      service.operationLog = {};
  
  
    }
  
    reset();
  
    service.start = function(ref, event) {
  
      var path = ref.toString();
  
      var id = Math.random().toString(36).slice(2);
  
      if (service.operations[event][path]) {
        service.operations[event][path]++;
      } else {
        service.operations[event][path] = 1;
      }
  
      service.operationCount++;
      service.operationLog[id] = {
        type: event,
        path: path,
        start: Date.now()
      };
  
      return id;
  
    };
  
    service.finish = function(id, err) {
  
      service.operationCount--;
  
      var logEvent = service.operationLog[id];
      logEvent.end = Date.now();
      logEvent.duration = logEvent.end - logEvent.start;
      if (err) {
        logEvent.error = err;
      }
  
      $log.debug('fp: completed', id, 'in', logEvent.duration);
      if (err) {
        $log.debug('fp: ' + logEvent.type + ' on path "' +
          logEvent.path + '" failed with error: "' +
          err.message + '"');
      }
  
      if (service.operationCount === 0) {
  
        if (service.timeout) {
          $timeout.cancel(service.timeout);
        }
  
        // wait 75 ms, then assume we're all done loading
        service.timeout = $timeout(function() {
  
          if (service.operationCount === 0) {
  
            var operationList = Object.keys(service.operationLog)
            .reduce(function(list, id) {
              return list.concat(service.operationLog[id]);
            }, [])
            .sort(function(a, b) {
              return (a.start - b.start) || (a.end - b.end);
            });
  
            // set the "fp-loaded" attribute on the body
            $animate.addClass($document, 'fp-loaded');
  
            // broadcast the "angular-fireproof:loaded event" with load data
            $rootScope.$broadcast(
              'angular-fireproof:loaded',
              service.operations,
              operationList);
  
          }
  
        }, 75);
  
      }
  
    };
  
  });
  
  
  angular.module('angular-fireproof')
  .controller('FirebaseCtl', function($q, Firebase) {
  
    /**
     * @ngdoc type
     * @name FirebaseCtl
     * @description FirebaseCtl is the core controller responsible for binding
     * Firebase data into Angular. It instantiates a root Firebase object based on
     * the value of the `firebase` property and attaches a core authentication
     * handler.
     * @property {Firebase} root The root of the instantiated Firebase store.
     * @property {object} $auth Firebase authentication data, or `null`.
     * @property {string} $userId Firebase unique user ID (like `simplelogin:1`), or `null`.
     */
  
    var self = this,
      _defaultLoginHandler = function() {
        return $q.reject(new Error('No login handler is set for ' + self.root));
      },
      _defaultLogoutHandler = function() {
        self.root.unauth();
      },
      _loginHandler = _defaultLoginHandler,
      _logoutHandler = _defaultLogoutHandler;
  
    function authHandler(authData) {
      self.auth = authData;
    }
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#login
     * @description Requests that the login handler demand credentials from the
     * user and return the result.
     * If no login handler has been set, this method will automatically reject.
     * @param {object=} options An arbitrary set of options which will be passed
     * to the login handler for convenience.
     * @return {Promise} A promise that resolves if the user successfully logs
     * in and rejects if the user refuses or fails to log in.
     */
    self.login = function(options) {
      return $q.when(_loginHandler(self.root, options));
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#setLoginHandler
     * @description Sets the login handler method.
     * @param {function=} fn The login handler. If none is supplied, resets to default.
     */
    self.setLoginHandler = function(fn) {
      _loginHandler = (fn || _defaultLoginHandler);
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#logout
     * @description Requests that the logout handler deauthorize the user and return
     * the result. Also made available on the enclosing scope as `$logout`.
     * If no `logout-handler` has been set, this method just calls `root.unauth()`.
     * @param {object=} options An arbitrary set of options which will be passed
     * to the logout handler for convenience.
     * @return {Promise} A promise that resolves if the user successfully logs
     * out and rejects if the user refuses or fails to log out.
     */
    self.logout = function(options) {
      return $q.when(_logoutHandler(self.root, options));
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#setLogoutHandler
     * @description Sets the logout handler method.
     * @param {function=} fn The logout handler. If none is supplied, resets to default.
     */
    self.setLogoutHandler = function(fn) {
      _logoutHandler = (fn || _defaultLogoutHandler);
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#cleanup
     * @description Removes and detaches all connections to Firebase used by
     * this controller.
     */
    self.cleanup = function() {
  
      // reset the login and logout handlers to default.
      _loginHandler = _defaultLoginHandler;
      _logoutHandler = _defaultLogoutHandler;
  
      // detach any remaining listeners here.
      self.root.offAuth(authHandler);
  
      // detach all listeners to prevent leaks.
      self.root.off();
  
      // remove the actual root object itself, as it's now invalid.
      delete self.root;
  
      // clear auth data.
      delete self.auth;
      delete self.userId;
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#attachFirebase
     * @description Connects to the specified Firebase.
     * @param {string} url The full URL of the Firebase to connect to.
     */
    self.attachFirebase = function(url) {
  
      // if we already have a root, make sure to clean it up first
      if (self.root) {
        self.cleanup();
      }
  
      self.root = new Firebase(url);
      self.root.onAuth(authHandler);
  
    };
  
  
  });
  

}));
