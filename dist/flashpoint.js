
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
   * @name flashpoint
   */
  angular.module('flashpoint', []);
  
  
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
  
  
  
  angular.module('flashpoint')
  .directive('fpPage', function($q, Fireproof, $animate) {
  
    /**
     * @ngdoc directive
     * @name fpPage
     * @description Pages over the keys at a Firebase location.
     *
     * fpPage exposes the following methods and variables on local scope:
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
      require: 'firebase',
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
  
  
  
  angular.module('flashpoint')
  .factory('Firebase', function() {
  
  /**
   * @ngdoc service
   * @name Firebase
   * @description The Firebase class.
   *
   * The Firebase library exposes this on window by default, but using Angular DI
   * allows it to be mocked or modified if you wish.
   *
   * NB: You should not use this service yourself! Instead, use the firebase
   * directive and write your own directives to require it, then access its
   * `root` Firebase reference.
   *
   * @see {@link FirebaseCtl#cleanup}
   */
  
    return Firebase;
  
  })
  .factory('ServerValue', function(Firebase) {
  
    /**
     * @ngdoc service
     * @name ServerValue
     * @description The object ordinarily discovered on `Firebase.ServerValue`.
     *
     * Available for convenience.
     * @see {@link Firebase}
     */
  
    return Firebase.ServerValue;
  
  })
  .factory('Fireproof', function($timeout, $q) {
  
    /**
     * @ngdoc service
     * @name Fireproof
     * @description The Fireproof class, properly configured for use in Angular.
     *
     * "Properly configured" means that $timeout is used for nextTick and
     * Angular's $q is used for promises).
     *
     * NB: You should not use this service yourself! Instead, use the firebase
     * directive and write your own directives to require it, then access its
     * `root` Firebase reference.
     */
  
    Fireproof.setNextTick($timeout);
    Fireproof.bless($q);
  
    return Fireproof;
  
  });
  
  
  fpViewFillContentFactory.$inject = ['$compile', '$controller', '$route'];
  function fpViewFillContentFactory($compile, $controller, $route) {
    return {
      restrict: 'ECA',
      priority: -350,
      terminal: true,
      link: function(scope, $element) {
  
        var locals = $route.current.locals;
  
        $element.html(locals.$template);
  
        var link = $compile($element.contents());
  
        angular.forEach(locals, function(value, name) {
  
          if (name.charAt(0) !== '$' && name.charAt(0) !== '_') {
            scope[name] = value;
          }
  
        });
  
        locals.$scope = scope;
        var controller = $controller('FirebaseCtl', locals);
        scope.fp = controller;
  
        $element.data('$firebaseController', controller);
        $element.children().data('$firebaseController', controller);
  
        link(scope);
  
      }
    };
  }
  
  angular.module('flashpoint')
  .constant('_fpFirebaseUrl', null)
  .constant('_fpOnLoaded', null)
  .constant('_fpOnError', null)
  .constant('fpRoute', function(routeDefinitionObject) {
  
    if (!routeDefinitionObject.firebase) {
      throw new Error('No Firebase URL has been defined in your controller. ' +
        'Please set the "firebase" property in your route definition object.');
    }
  
    routeDefinitionObject.resolve = routeDefinitionObject.resolve || {};
  
    var firebaseUrl = routeDefinitionObject.firebase;
    delete routeDefinitionObject.firebase;
  
    if (routeDefinitionObject.loaded) {
  
      var onLoaded = routeDefinitionObject.loaded;
      delete routeDefinitionObject.loaded;
  
      routeDefinitionObject.resolve._fpOnLoaded = function() {
        return onLoaded;
      };
  
    }
  
    if (routeDefinitionObject.error) {
  
      var onError = routeDefinitionObject.error;
      delete routeDefinitionObject.error;
  
      routeDefinitionObject.resolve._fpOnError = function() {
        return onError;
      };
  
    }
  
    routeDefinitionObject.resolve._fpFirebaseUrl = function($q, $injector, Firebase, Fireproof) {
  
      var root = new Fireproof(new Firebase(firebaseUrl));
  
      return $q.when()
      .then(function() {
  
        if (routeDefinitionObject.challenge &&
          root.getAuth() === null &&
          routeDefinitionObject.alwaysChallenge !== false) {
  
          // the "challenge" function is injectable
          return $injector.invoke(routeDefinitionObject.challenge, null, {
            root: root
          });
  
        }
  
      })
      .then(function() {
  
        if (routeDefinitionObject.authorize) {
  
          // the "authorize" function is injectable
          return $injector.invoke(routeDefinitionObject.authorize, null, {
            root: root,
            auth: root.getAuth()
          });
  
        }
  
      })
      .then(function() {
        return firebaseUrl;
      });
  
    };
  
    routeDefinitionObject.resolve._fpFirebaseUrl.$inject =
      ['$q', '$injector', 'Firebase', 'Fireproof'];
  
    return routeDefinitionObject;
  
  })
  .directive('fpView', fpViewFillContentFactory);
  
  
  angular.module('flashpoint')
  .value('fpLoadedTimeout', 20000)
  .service('firebaseStatus', function(
    $interval,
    $timeout,
    $document,
    $animate,
    $rootScope,
    $log,
    fpLoadedTimeout
  ) {
  
    var service = this;
  
    function reset() {
  
      service.errors = [];
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
  
    $rootScope.$on('$routeChangeStart', function() {
      reset();
    });
  
    $rootScope.$on('$viewContentLoaded', function() {
  
      $rootScope.$broadcast('flashpointLoading');
      $animate.addClass($document, 'fp-loading');
  
      // after 20 seconds, assume something's gone wrong and signal timeout.
      var deadHand = $timeout(function() {
  
        $interval.cancel(intervalId);
        $rootScope.$broadcast('flashpointTimeout');
  
      }, fpLoadedTimeout);
  
      // keep checking back to see if all Angular loading is done yet.
      var intervalId = $interval(function() {
  
        if (service.operationCount === 0) {
  
          $timeout.cancel(deadHand);
          $interval.cancel(intervalId);
  
          var operationList = Object.keys(service.operationLog)
          .reduce(function(list, id) {
            return list.concat(service.operationLog[id]);
          }, [])
          .sort(function(a, b) {
            return (a.start - b.start) || (a.end - b.end);
          });
  
          // set the "fp-loaded" attribute on the body
          $animate.setClass($document, 'fp-loaded', 'fp-loading');
  
          // broadcast the "flashpoint:loaded event" with load data
          if (service.errors.length > 0) {
            $rootScope.$broadcast('flashpointError', service.errors);
          } else {
            $rootScope.$broadcast('flashpointLoaded', operationList);
          }
  
        }
  
      }, 100);
  
    });
  
    service.start = function(event, ref) {
  
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
  
      var logEvent = service.operationLog[id];
  
      if (!logEvent) {
        throw new Error('fp: reference to unknown log event', id);
      }
  
      if (!logEvent.end) {
  
        service.operationCount--;
  
        logEvent.count = 1;
        logEvent.end = Date.now();
        logEvent.duration = logEvent.end - logEvent.start;
        if (err) {
          logEvent.error = err;
          service.errors.push(err);
        }
  
        $log.debug('fp: completed', logEvent.type, 'of',
          logEvent.path, 'in', logEvent.duration, 'ms');
  
        if (err) {
          $log.debug('fp: ' + logEvent.type + ' on path "' +
            logEvent.path + '" failed with error: "' +
            err.message + '"');
        }
  
      } else if (logEvent.type === 'read') {
  
        // reads can happen multiple times (i.e., because of an "on")
        if (err) {
  
          logEvent.errorAt = Date.now();
          logEvent.error = err;
          $log.debug('fp: read listener on path "' +
            logEvent.path + '" was terminated with error: "' +
            err.message + '"');
  
        } else {
  
          logEvent.count++;
          $log.debug('fp: read listener on', logEvent.path, 'has now gotten',
            logEvent.count, 'responses');
  
        }
  
      }
  
    };
  
  });
  
  
  function FirebaseCtl(
    $q,
    $scope,
    $injector,
    Firebase,
    Fireproof,
    firebaseStatus,
    _fpFirebaseUrl,
    _fpOnLoaded,
    _fpOnError) {
  
    /**
     * @ngdoc type
     * @name FirebaseCtl
     * @module flashpoint
     * @description The core controller responsible for binding
     * Firebase data into Angular.
     *
     * Firebase instantiates a root Firebase object based on
     * the value of the `firebase` property and attaches a core authentication
     * handler.
     * @property {Firebase} root The root of the instantiated Firebase store.
     * @property {object} $auth Firebase authentication data, or `null`.
     */
  
    var self = this,
        watchers = {},
        values = {},
        _defaultLoginHandler = function() {
          return $q.reject(new Error('No login handler is set for ' + self.root));
        },
        _defaultLogoutHandler = function() {
          self.root.unauth();
        },
        _loginHandler = _defaultLoginHandler,
        _logoutHandler = _defaultLogoutHandler;
  
  
    self.auth = null;
  
    function authHandler(authData) {
      self.auth = authData;
      if (_fpFirebaseUrl !== null) {
  
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
  
      self.root = new Fireproof(new Firebase(url));
      self.auth = self.root.getAuth();
      self.root.onAuth(authHandler);
  
    };
  
  
    self.set = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        value = args.pop(),
        path = validatePath(args);
  
      return makeClosure(function() {
  
        var id = firebaseStatus.start('set', self.root.child(path));
        return self.root.child(path).set(value)
        .finally(function(err) {
          firebaseStatus.finish(id, err);
        });
  
      });
  
    };
  
  
    self.setPriority = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        priority = args.pop(),
        path = validatePath(args);
  
      return makeClosure(function() {
  
        var id = firebaseStatus.start('setPriority', self.root.child(path));
        return self.root.child(path).setPriority(priority)
        .finally(function(err) {
          firebaseStatus.finish(id, err);
        });
  
      });
  
    };
  
  
    self.setWithPriority = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        priority = args.pop(),
        value = args.pop(),
        path = validatePath(args);
  
      return makeClosure(function() {
  
        var id = firebaseStatus.start('setWithPriority', self.root.child(path));
        return self.root.child(path)
        .setWithPriority(value, priority)
        .finally(function(err) {
          firebaseStatus.finish(id, err);
        });
  
      });
  
    };
  
  
    self.update = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        value = args.pop(),
        path = validatePath(args);
  
      return makeClosure(function() {
  
        var id = firebaseStatus.start('update', self.root.child(path));
        return self.root.child(path).update(value)
        .finally(function(err) {
          firebaseStatus.finish(id, err);
        });
  
      });
  
    };
  
  
    self.remove = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        path = validatePath(args);
  
      return makeClosure(function() {
  
        var id = firebaseStatus.start('remove', self.root.child(path));
        return self.root.child(path).remove()
        .finally(function(err) {
          firebaseStatus.finish(id, err);
        });
  
      });
  
    };
  
  
    self.increment = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        path = validatePath(args);
  
      return makeClosure(function() {
  
        var id = firebaseStatus.start('increment', self.root.child(path));
        return self.root.child(path)
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
          firebaseStatus.finish(id, err);
        });
  
      });
  
    };
  
  
    self.decrement = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        path = validatePath(args);
  
      return makeClosure(function() {
  
        var id = firebaseStatus.start('decrement', self.root.child(path));
        return self.root.child(path)
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
          firebaseStatus.finish(id, err);
        });
  
      });
  
    };
  
  
    self.val = function() {
  
      var path = validatePath(Array.prototype.slice.call(arguments, 0));
      if (!path) {
        return;
      }
  
      if (!values.hasOwnProperty(path)) {
        values[path] = null;
      }
  
      if (!watchers[path]) {
  
        var id = firebaseStatus.start('read', self.root.child(path));
  
        watchers[path] = self.root.child(path)
        .on('value', function(snap) {
  
          setTimeout(function() {
  
            $scope.$apply(function() {
  
              firebaseStatus.finish(id);
              values[path] = snap.val();
  
            });
  
          }, 0);
  
        }, function(err) {
  
          if (id) {
            firebaseStatus.finish(id, err);
            id = null;
          }
  
        });
  
      }
  
      return values[path];
  
    };
  
  
    $scope.$on('$destroy', function() {
  
      // remove all listeners
      angular.forEach(watchers, function(watcher, path) {
        self.root.child(path).off('value', watcher);
      });
  
      // shut down controller
      self.cleanup();
  
    });
  
  
    // handle route controller stuff.
  
    if (_fpFirebaseUrl !== null) {
  
      // attach using this url.
      self.attachFirebase(_fpFirebaseUrl);
  
    }
  
    if (angular.isFunction(_fpOnLoaded)) {
  
      var cancel = $scope.$on('flashpointLoaded', function() {
  
        cancel();
        $injector.invoke(_fpOnLoaded, null, {
          root: self.root,
          auth: self.auth
        });
  
      });
  
    }
  
    if (angular.isFunction(_fpOnError)) {
  
      var onError = function(err) {
  
        $injector.invoke(_fpOnError, null, {
          root: self.root,
          auth: self.auth,
          error: err
        });
  
      };
  
      $scope.$on('flashpointError', onError);
      $scope.$on('flashpointTimeout', onError);
  
    }
  
  
  }
  
  
  angular.module('flashpoint')
  .controller('FirebaseCtl', FirebaseCtl);
  

}));
