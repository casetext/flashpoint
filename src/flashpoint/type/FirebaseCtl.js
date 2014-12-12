
function FirebaseCtl(
  $log,
  $q,
  $scope,
  $injector,
  $timeout,
  Firebase,
  Fireproof,
  ChildQuery,
  validatePath,
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

  // Clean up orphaned Firebase listeners between scope cycles.
  // HERE BE DRAGONS! We employ the private $scope.$$postDigest method.
  var scrubbingListeners = false;

  function scrubListeners() {

    for (var path in watchers) {

      if (watchers[path] && !liveWatchers[path]) {

        // disconnect this watcher, it doesn't exist anymore.
        if (watchers[path].disconnect) {
          watchers[path].disconnect();
        } else {
          self.root.child(path).off('value', watchers[path]);
          values[path] = null;
        }

        watchers[path] = null;

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
   * @description Set a Firebase path to a given value.
   * @param {...string} pathPart Path components to be joined.
   * @param {(Object|String|Number|Boolean|Array|null)} value The value to set the path to.
   * @returns {Promise}
   * @see Fireproof#set
   *
   * @example
   * ```js
   * fp.set('users', 'fritz', { hometown: 'Metropolis'})
   * ```
   *
   * ```html
   * <button ng-click="fp.set('users', user, 'activated', true)">Activate!</button>
   * ```
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
   * @description Set a Firebase path to a given priority.
   * @param {...string} pathPart Path components to be joined.
   * @param {(String|Number|null)} priority The priority to set the path to.
   * @returns {Promise}
   * @see Fireproof#setPriority
   *
   * @example
   * ```js
   * fp.setPriority('users', 'fritz', Date)
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
   * @description Set a Firebase path to a given value and priority.
   * @param {...string} pathPart Path components to be joined.
   * @param {(Object|String|Number|Boolean|Array|null)} value The value to set the path to.
   * @param {(String|Number|null)} priority The priority to set the path to.
   * @returns {Promise}
   * @see Fireproof#setWithPriority
   *
   * @example
   * ```js
   * fp.setWithPriority('users', 'fritz', { hometown: 'Metropolis' }, Date)
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
   * @description Add a child to a Firebase path.
   * @param {...string} pathPart Path components to be joined.
   * @param {(Object|String|Number|Boolean|Array|null)} value The value to append to the path.
   * @param {(String|Number|null)} priority The priority to set the path to.
   * @returns {Promise}
   * @see Fireproof#push
   *
   * @example
   * ```js
   * fp.push('users', { name: 'Fritz', hometown: 'Metropolis' })
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
   * @description Update a Firebase path with a given object.
   * @param {...string} pathPart Path components to be joined.
   * @param {(Object|String|Number|Boolean|Array|null)} value The value to update the path with.
   * @returns {Promise}
   * @see Fireproof#update
   *
   * @example
   * ```js
   * fp.update('users', 'fritz', { hometown: 'Metropolis' })
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
   * @description Remove a Firebase path.
   * @param {...string} pathPart Path components to be joined.
   * @returns {Promise}
   * @see Fireproof#remove
   *
   * @example
   * ```js
   * fp.remove('users', 'fritz')
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
   * @description Atomically increments a numeric value in Firebase.
   * @param {...string} pathPart Path components to be joined.
   * @returns {Promise}
   *
   * @example
   * ```js
   * fp.increment('users/fritz/votes')
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
   * @description Atomically decrements a numeric value in Firebase.
   * @param {...string} pathPart Path components to be joined.
   * @returns {Promise}
   *
   * @example
   * ```js
   * fp.decrement('users', 'fritz', 'votes')
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
   * @description Performs a transaction in Firebase.
   * @param {...string} pathPart Path components to be joined.
   * @param {Function} fn The function that describes the transaction. Takes one
   * argument, the existing value in Firebase. See the Firebase docs on transactions.
   * @returns {Promise}
   * @see Fireproof#transaction
   *
   * @example
   * ```js
   * fp.decrement('users', 'fritz', 'votes')
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

      watchers[path] = self.root.child(path)
      .on('value', function(snap) {

        values[path] = snap.val();
        $scope.$evalAsync();

      });

    }

    return values[path];

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#children
   * @description Provides a live array of the children at a path in Firebase.
   * @param {...string} pathPart Path components to be joined.
   * @returns {Fireproof.LiveArray} A live array, which is an object with three keys:
   * 'keys', 'priorities', and 'values'.
   * The array references are guaranteed to remain stable, so you can bind to them
   * directly.
   * @see ChildQuery
   * @example
   * ```html
   * <ul>
   *   <li ng-repeat="user in fp.children().orderByChild('lastName').startAt('Ba').endAt('Bz').of('users').values">
   *      <span>{{ user.firstName }} {{ user.lastName }} is a user whose last name starts with B!</span>
   *   </li>
   * </ul>
   * ```
   */
  self.children = function() { return new ChildQuery(self.root, watchers, liveWatchers); };


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
