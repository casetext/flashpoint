
function FirebaseCtl(
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


  function makeClosure(operation, path, fn) {

    var closure = function() {

      var id = firebaseStatus.start(operation, self.root.child(path));
      return fn()
      .catch(function(err) {

        if (closure._onError) {
          closure._onError(err, path);
        } else {
          return $q.reject(err);
        }

      })
      .finally(function(err) {
        firebaseStatus.finish(id, err);
      });

    };

    closure.or = function(errHandler) {
      closure._onError = errHandler;
      return closure;
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

    return makeClosure('set', path, function() {
      return self.root.child(path).set(value);
    });

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

    return makeClosure('setPriority', path, function() {
      return self.root.child(path).setPriority(priority);
    });

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

      return makeClosure('setWithPriority', path, function() {
        return self.root.child(path).setWithPriority(value, priority);
      });

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

    return makeClosure('update', path, function() {
      return self.root.child(path).update(value);
    });

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

    return makeClosure('remove', path, function() {
      return self.root.child(path).remove();
    });

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
   * fp.increment('users', 'fritz', 'votes').now()
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

    return makeClosure('increment', path, function() {

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

    return makeClosure('decrement', path, function() {

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
      fn = args.pop();

    var path = validatePath(args);

    return makeClosure('transaction', path, function() {

      return self.root.child(path)
      .transaction(function(val) {
        return fn(val);
      })
      .then(function(result) {

        if (!result.committed) {
          return $q.reject(new Error('Aborted'));
        }

      });

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
        error: err
      });

    };

    $scope.$on('flashpointLoadError', onError);
    $scope.$on('flashpointLoadTimeout', onError);

  }

  if (angular.isFunction(_fpHandleLogin)) {

    self.setLoginHandler(function() {

      return $injector.invoke(_fpHandleLogin, null, {
        root: self.root,
        auth: self.auth
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
