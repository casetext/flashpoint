
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

  this.__firebaseCtl = true;

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
      self.root.child(path).remove()
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
      self.root.child(path)
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
    $scope.fp = self;

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
