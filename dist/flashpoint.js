
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
  
  
  
  angular.module('flashpoint')
  .directive('fpPage', function($q, Fireproof, $animate, firebaseStatus) {
  
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
     * | `$values`      | {@type Array.*}      | The values in the current page.                            |
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
      link: function(scope, el, attrs, fp) {
  
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
  
          ref = fp.root.child(path);
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
  .factory('Fireproof', function($rootScope, $q) {
  
    /**
     * @ngdoc service
     * @name Fireproof
     * @description The Fireproof class, properly configured for use in Angular.
     *
     * "Properly configured" means that $rootScope.$evalAsync is used for nextTick and
     * Angular's $q is used for promises).
     *
     * NB: You should not use this service yourself! Instead, use the firebase
     * directive and write your own directives to require it, then access its
     * `root` Firebase reference.
     */
  
    Fireproof.setNextTick(function(fn) {
      $rootScope.$evalAsync(fn);
    });
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
  .constant('_fpHandleLogin', null)
  .constant('_fpHandleLogout', null)
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
  
    if (routeDefinitionObject.login) {
  
      var login = routeDefinitionObject.login;
  
      routeDefinitionObject.resolve._fpHandleLogin = function() {
        return login;
      };
  
    }
  
    if (routeDefinitionObject.logout) {
  
      var logout = routeDefinitionObject.logout;
      delete routeDefinitionObject.logout;
  
      routeDefinitionObject.resolve._fpHandleLogout = function() {
        return logout;
      };
  
    }
  
  
    routeDefinitionObject.resolve._fpFirebaseUrl = function($q, $injector, Firebase, Fireproof) {
  
      var root = new Fireproof(new Firebase(firebaseUrl));
  
      return $q.when()
      .then(function() {
  
        if (routeDefinitionObject.challenge &&
          routeDefinitionObject.login &&
          root.getAuth() === null) {
  
          // the "login" function is injectable
          return $injector.invoke(routeDefinitionObject.login, null, {
            root: root,
            auth: null
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
    Fireproof,
    fpLoadedTimeout
  ) {
  
    var service = this;
  
    function switchOff() {
  
      Fireproof.stats.off('finish', actionFinished);
      Fireproof.stats.off('error', actionErrored);
      $timeout.cancel(service._deadHand);
  
    }
  
    function actionFinished() {
  
      if (Fireproof.stats.runningOperationCount === 0) {
  
        switchOff();
  
        var operationList = [];
        for (var id in Fireproof.stats.operationLog) {
          operationList.push(Fireproof.stats.operationLog[id]);
        }
  
        operationList.sort(function(a, b) {
          return (a.start - b.start) || (a.end - b.end);
        });
  
        // set the "fp-loaded" attribute on the body
        $animate.setClass($document, 'fp-loaded', 'fp-loading');
  
        $rootScope.$broadcast('flashpointLoadSuccess', operationList);
  
      }
  
    }
  
    function actionErrored(event) {
  
      switchOff();
      $rootScope.$broadcast('flashpointLoadError', event);
  
    }
  
    function reset() {
  
      Fireproof.stats.reset();
      Fireproof.stats.resetListeners();
  
    }
  
    reset();
  
    $rootScope.$on('$routeChangeStart', function() {
      reset();
    });
  
    $rootScope.$on('$viewContentLoaded', function() {
  
      $rootScope.$broadcast('flashpointLoadStart');
      $animate.addClass($document, 'fp-loading');
  
      // after 20 seconds, assume something's gone wrong and signal timeout.
      service._deadHand = $timeout(function() {
  
        switchOff();
        $rootScope.$broadcast('flashpointLoadTimeout');
  
      }, fpLoadedTimeout);
  
      Fireproof.stats.on('finish', actionFinished);
      Fireproof.stats.on('error', actionErrored);
  
    });
  
  });
  
  
  function FirebaseCtl(
    $log,
    $q,
    $scope,
    $injector,
    $timeout,
    Firebase,
    Fireproof,
    firebaseStatus,
    _fpHandleLogin,
    _fpHandleLogout,
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
        watchers = self.$$watchers = {},
        liveWatchers = {},
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
     * If no logout handler has been set, this method just calls `root.unauth()`.
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
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#set
     * @description Generates an operation to set a Firebase path to a given value.
     * @param {...string} pathPart Path components to be joined.
     * @param {(Object|String|Number|Boolean|Array|null)} value The value to set the path to.
     * @returns {Function} A closure function that will perform the specified operation.
     * In an Angular expression, it will execute automatically. You can also call its
     * `.now()` method to get it to fire immediately.
     *
     * @example
     * ```js
     * fp.set('users', 'fritz', { hometown: 'Metropolis'}).now()
     * ```
     *
     * ```html
     * <button ng-click="fp.set('users', user, 'activated', true)">Activate!</button>
     * ```
     * @see Firebase#set
     */
    self.set = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        value = args.pop(),
        path = validatePath(args);
  
      return self.root.child(path).set(value);
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#setPriority
     * @description Generates an operation to set a Firebase path to a given priority.
     * @param {...string} pathPart Path components to be joined.
     * @param {(String|Number|null)} priority The priority to set the path to.
     * @returns {Function} A closure function that will perform the specified operation.
     * In an Angular expression, it will execute automatically. You can also call its
     * `.now()` method to get it to fire immediately.
     *
     * @example
     * ```js
     * fp.setPriority('users', 'fritz', Date.now()).now()
     * ```
     *
     * ```html
     * <button ng-click="fp.setPriority('users', user, 0)">To teh top!</button>
     * ```
     * @see Firebase#setPriority
     */
    self.setPriority = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        priority = args.pop(),
        path = validatePath(args);
  
      return self.root.child(path).setPriority(priority);
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#setWithPriority
     * @description Generates an operation to set a Firebase path to a given value and priority.
     * @param {...string} pathPart Path components to be joined.
     * @param {(Object|String|Number|Boolean|Array|null)} value The value to set the path to.
     * @param {(String|Number|null)} priority The priority to set the path to.
     * @returns {Function} A closure function that will perform the specified operation.
     * In an Angular expression, it will execute automatically. You can also call its
     * `.now()` method to get it to fire immediately.
     *
     * @example
     * ```js
     * fp.setWithPriority('users', 'fritz', { hometown: 'Metropolis' }, Date.now()).now()
     * ```
     *
     * ```html
     * <button ng-click="fp.setWithPriority('status', event, 'pending', 0)">Reset to pending</button>
     * ```
     * @see Firebase#setWithPriority
     */
    self.setWithPriority = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        priority = args.pop(),
        value = args.pop(),
        path = validatePath(args);
  
        return self.root.child(path).setWithPriority(value, priority);
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#push
     * @description Generates an operation to add a child to a Firebase path.
     * @param {...string} pathPart Path components to be joined.
     * @param {(Object|String|Number|Boolean|Array|null)} value The value to append to the path.
     * @param {(String|Number|null)} priority The priority to set the path to.
     * @returns {Function} A closure function that will perform the specified operation.
     * In an Angular expression, it will execute automatically. You can also call its
     * `.now()` method to get it to fire immediately.
     *
     * @example
     * ```js
     * fp.push('users', { name: 'Fritz', hometown: 'Metropolis' }).now()
     * ```
     *
     * ```html
     * <button ng-click="fp.push('comments', commentText)">Add your comment!</button>
     * ```
     * @see Firebase#push
     */
    self.push = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        value = args.pop(),
        path = validatePath(args);
  
      return self.root.child(path).push(value);
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#update
     * @description Generates an operation to update a Firebase path to a given value.
     * @param {...string} pathPart Path components to be joined.
     * @param {(Object|String|Number|Boolean|Array|null)} value The value to update the path with.
     * @returns {Function} A closure function that will perform the specified operation.
     * In an Angular expression, it will execute automatically. You can also call its
     * `.now()` method to get it to fire immediately.
     *
     * @example
     * ```js
     * fp.update('users', 'fritz', { hometown: 'Metropolis' }).now()
     * ```
     *
     * ```html
     * <button ng-click="fp.update('users', user, { disabled: true } )">Disable user</button>
     * ```
     * @see Firebase#update
     */
    self.update = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        value = args.pop(),
        path = validatePath(args);
  
      return self.root.child(path).update(value);
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#remove
     * @description Generates an operation to remove a Firebase path.
     * @param {...string} pathPart Path components to be joined.
     * @returns {Function} A closure function that will perform the specified operation.
     * In an Angular expression, it will execute automatically. You can also call its
     * `.now()` method to get it to fire immediately.
     *
     * @example
     * ```js
     * fp.remove('users', 'fritz').now()
     * ```
     *
     * ```html
     * <button ng-click="fp.remove('users', user)">Remove user</button>
     * ```
     * @see Firebase#update
     */
    self.remove = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        path = validatePath(args);
  
      return self.root.child(path).remove();
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#increment
     * @description Generates an operation to atomically increment a numeric value in Firebase.
     * @param {...string} pathPart Path components to be joined.
     * @returns {Function} A closure function that will perform the specified operation.
     * In an Angular expression, it will execute automatically. You can also call its
     * `.now()` method to get it to fire immediately.
     *
     * @example
     * ```js
     * fp.increment('users/fritz/votes').now()
     * ```
     *
     * ```html
     * <button ng-click="fp.increment('users', user, 'votes')">Vote for this user!</button>
     * ```
     */
    self.increment = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        path = validatePath(args);
  
  
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
  
      });
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#decrement
     * @description Generates an operation to atomically decrement a numeric value in Firebase.
     * @param {...string} pathPart Path components to be joined.
     * @returns {Function} A closure function that will perform the specified operation.
     * In an Angular expression, it will execute automatically. You can also call its
     * `.now()` method to get it to fire immediately.
     * @throws {Error} if you specify a non-numeric non-null Firebase value.
     *
     * @example
     * ```js
     * fp.decrement('users', 'fritz', 'votes').now()
     * ```
     *
     * ```html
     * <button ng-click="fp.decrement('users', user, 'votes')">Vote against this user!</button>
     * ```
     */
    self.decrement = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        path = validatePath(args);
  
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
  
      });
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#transaction
     * @description Generates an operation to perform a transaction in Firebase.
     * @param {...string} pathPart Path components to be joined.
     * @param {Function} fn The function that describes the transaction. Takes one
     * argument, the existing value in Firebase. See the Firebase docs on transactions.
     * @returns {Function} A closure function that will perform the specified operation.
     * In an Angular expression, it will execute automatically. You can also call its
     * `.now()` method to get it to fire immediately.
     *
     * @example
     * ```js
     * fp.decrement('users', 'fritz', 'votes').now()
     * ```
     *
     * ```html
     * <button ng-click="fp.decrement('users', user, 'votes')">Vote against this user!</button>
     * ```
     * @see Firebase#transaction
     */
    self.transaction = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        fn = args.pop(),
        path = validatePath(args);
  
      return self.root.child(path)
      .transaction(function(val) {
        return fn(val);
      })
      .then(function(result) {
  
        if (!result.committed) {
          return $q.reject(new Error('Aborted'));
        }
  
      });
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#val
     * @description Gets a value from Firebase and triggers scope refresh when that value changes.
     * @param {...string} pathPart Path components to be joined.
     * @returns {*} `null` on the first scope digest, and the actual value subsequently.
     *
     * @example
     * ```html
     * <span>Welcome, {{ fp.val('users', userId, 'firstName') }}!</button>
     * ```
     */
    self.val = function() {
  
      var path = validatePath(Array.prototype.slice.call(arguments, 0));
      if (!path) {
        return;
      }
  
      if (!values.hasOwnProperty(path)) {
        values[path] = null;
      }
  
      liveWatchers[path] = true;
  
      if (!watchers[path]) {
  
        var id = Fireproof.stats._start('read', self.root.child(path));
        watchers[path] = self.root.child(path).toFirebase()
        .on('value', function(snap) {
  
          Fireproof.stats._finish(id);
          values[path] = snap.val();
          $scope.$evalAsync();
  
        }, function(err) {
          Fireproof.stats._finish(id, err);
        });
  
      }
  
      return values[path];
  
    };
  
  
    // Clean up orphaned Firebase listeners between scope cycles.
    // HERE BE DRAGONS! We employ the private $scope.$$postDigest method.
    var scrubbingListeners = false;
  
    function scrubListeners() {
  
      for (var path in watchers) {
  
        if (watchers[path] && !liveWatchers[path]) {
  
          // disconnect this watcher, it doesn't exist anymore.
          self.root.child(path).toFirebase().off('value', watchers[path]);
          watchers[path] = null;
          values[path] = null;
  
        }
  
      }
  
      // as of now, nothing is alive.
      liveWatchers = {};
      scrubbingListeners = false;
  
    }
  
    $scope.$watch(function() {
  
      if (!scrubbingListeners) {
  
        scrubbingListeners = true;
        $scope.$$postDigest(scrubListeners);
  
      }
  
    });
  
  
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
  
      var cancel = $scope.$on('flashpointLoadSuccess', function() {
  
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
          event: err
        });
  
      };
  
      $scope.$on('flashpointLoadError', onError);
      $scope.$on('flashpointLoadTimeout', onError);
  
    }
  
    if (angular.isFunction(_fpHandleLogin)) {
  
      self.setLoginHandler(function() {
  
        return $injector.invoke(_fpHandleLogin, null, {
          root: self.root
        });
  
      });
  
    }
  
    if (angular.isFunction(_fpHandleLogout)) {
  
      self.setLogoutHandler(function() {
  
        return $injector.invoke(_fpHandleLogout, null, {
          root: self.root,
          auth: self.auth
        });
  
      });
  
    }
  
  }
  
  
  angular.module('flashpoint')
  .controller('FirebaseCtl', FirebaseCtl);
  

}));
