
function FirebaseCtl(
  $scope,
  $q,
  Firebase,
  Fireproof,
  fpValidatePath,
  FPListenerSet) {

  /**
   * @ngdoc type
   * @name FirebaseCtl
   * @module flashpoint
   * @description The core controller responsible for binding
   * Firebase data into Angular.
   *
   * @property {Firebase} root The root of the instantiated Firebase store.
   *
   * @property {Boolean} connected The state of the network connection to Firebase.
   * This will be:
   * - `true`, if there is a good network connection to Firebase
   * - `false`, if the connection to Firebase is interrupted or not available
   * - `undefined` if the connection state is not known
   *
   * @property {Object} auth The authentication data from Firebase. This will be:
   * - `null`, if the user is not authenticated
   * - `undefined`, if the authentication state is not yet known
   * - an `Object`, containing information about the currently-authenticated user
   *
   * @property {Error} authError The error reported by the most recent attempt to
   * authenticate to Firebase, or `null` otherwise.
   *
   * @property {Error} accountError The error reported by the most recent attempt
   * to perform an account-related action on Firebase, or `null` otherwise.
   *
   * @property {Boolean} accountChanging True if an account-changing action
   * (password reset, user delete, etc.) is in progress, false otherwise.
   *
   * @property {Boolean} authenticating True if an authentication attempt is
   * in progress, false otherwise.
   */

  var self = this;

  var _attachListeners = [],
    _detachListeners = [];

  self.auth = null;
  self.authError = null;
  self.accountError = null;
  self.authenticating = false;
  self.accountChanging = false;

  function authHandler(authData) {

    if (self.listenerSet) {
      self.listenerSet.clear();
    }
    self.auth = authData;

    $scope.$evalAsync();

  }


  function connectedListener(snap) {

    self.connected = snap.val();
    $scope.$evalAsync();

  }


  function authPassHandler(auth) {

    self.authenticating = false;
    self.authError = null;
    return auth;

  }


  function authErrorHandler(err) {

    self.authenticating = true;
    self.authError = err;
    return $q.reject(err);

  }


  function accountPassHandler() {

    self.accountChanging = false;
    self.accountError = null;

  }


  function accountErrorHandler(err) {

    self.accountChanging = false;
    self.accountError = err;
    return $q.reject(err);

  }


  /**
   * @ngdoc method
   * @name FirebaseCtl#detachFirebase
   * @description Removes and detaches all connections to Firebase used by
   * this controller.
   */
  self.detachFirebase = function() {

    // detach all watchers
    if (self.listenerSet) {

      self.listenerSet.clear();
      delete self.listenerSet;

    }

    delete self.connected;

    self.auth = null;
    self.authError = null;
    self.accountError = null;
    self.authenticating = false;
    self.accountChanging = false;

    if (self.root) {

      // detach any remaining listeners here.
      self.root.offAuth(authHandler);
      self.root.child('.info/connected').off('value', connectedListener);
      self.root.off();

      _detachListeners.forEach(function(listener) {
        listener(self.root);
      });

      // remove the actual root object itself, as it's now invalid.
      delete self.root;

    }

    $scope.$evalAsync();

  };


  self.onDetach = function(fn) {

    _detachListeners.push(fn);

    if (!self.root) {
      fn();
    }

    return fn;

  };


  self.offDetach = function(fn) {
    _detachListeners.splice(_detachListeners.indexOf(fn), 1);
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
      self.detachFirebase();
    }

    self.root = new Fireproof(new Firebase(url));

    self.listenerSet = new FPListenerSet(self.root, $scope);
    self.root.onAuth(authHandler);

    // maintain knowledge of connection status
    // we assume, optimistically, that we're connected initially
    self.connected = true;
    self.root.child('.info/connected')
    .on('value', connectedListener);

    _attachListeners.forEach(function(listener) {
      listener(self.root);
    });

  };

  self.onAttach = function(fn) {

    _attachListeners.push(fn);

    if (self.root) {
      fn(self.root);
    }

    return fn;

  };


  self.offAttach = function(fn) {
    _attachListeners.splice(_attachListeners.indexOf(fn), 1);
  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#goOffline
   * @description Disables the connection to the remote Firebase server. NOTE:
   * this method affects _all_ FirebaseCtl instances on the page.
   * @see Firebase.goOffline
   */
  self.goOffline = function() {
    Firebase.goOffline();
  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#goOnline
   * @description Enables the connection to the remote Firebase server. NOTE:
   * this method affects _all_ FirebaseCtl instances on the page.
   * @see Firebase.goOnline
   */
  self.goOnline = function() {
    Firebase.goOnline();
  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#unauth
   * @description Unauthenticates (i.e., logs out) the Firebase connection.
   * @see Fireproof#unauth
   */
  self.unauth = function() {

    self.authError = null;
    self.accountError = null;

    self.root.unauth();

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#authWithCustomToken
   * @description Authenticates using a custom token or Firebase secret.
   * @param {String} token The token to authenticate with.
   * @returns {Promise} that resolves on success and rejects on error.
   * @see Fireproof#authWithCustomToken
   */
  self.authWithCustomToken = function(token) {

    self.authenticating = true;

    return self.root.authWithCustomToken(token)
    .then(authPassHandler, authErrorHandler);

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#authAnonymously
   * @description Authenticates using a new, temporary guest account.
   * @param {Object} options
   * @returns {Promise} that resolves on success and rejects on error.
   * @see Fireproof#authAnonymously
   */
  self.authAnonymously = function(options) {

    self.authenticating = true;

    return self.root.authAnonymously(null, options)
    .then(authPassHandler, authErrorHandler);

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#authWithPassword
   * @description Authenticates using an email / password combination.
   * @param {String} email
   * @param {String} password
   * @returns {Promise} that resolves on success and rejects on error.
   * @see Fireproof#authWithPassword
   */
  self.authWithPassword = function(email, password) {

    self.authenticating = true;

    return self.root.authWithPassword({ email: email, password: password })
    .then(authPassHandler, authErrorHandler);

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#authWithOAuthPopup
   * @description Authenticates using a popup-based OAuth flow.
   * @param {String} provider
   * @param {Object} options
   * @returns {Promise} that resolves on success and rejects on error.
   * @see Fireproof#authWithOAuthPopup
   */
  self.authWithOAuthPopup = function(provider, options) {

    self.authenticating = true;

    return self.root.authWithOAuthPopup(provider, null, options)
    .then(authPassHandler, authErrorHandler);

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#authWithOAuthToken
   * @description Authenticates using OAuth access tokens or credentials.
   * @param {String} provider
   * @param {Object} credentials
   * @param {Object} options
   * @returns {Promise} that resolves on success and rejects on error.
   * @see Fireproof#authWithOAuthToken
   */
  self.authWithOAuthToken = function(provider, credentials, options) {

    self.authenticating = true;

    return self.root.authWithOAuthToken(provider, credentials, null, options)
    .then(authPassHandler, authErrorHandler);

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#createUser
   * @description Creates a new user account using an email / password combination.
   * @param {String} email
   * @param {String} password
   * @returns {Promise} that resolves on success and rejects on error.
   * @see Fireproof#createUser
   */
  self.createUser = function(email, password) {

    self.accountChanging = true;

    return self.root.createUser({ email: email, password: password })
    .then(accountPassHandler, accountErrorHandler);

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#removeUser
   * @description Removes an existing user account using an email / password combination.
   * @param {String} email
   * @param {String} password
   * @returns {Promise} that resolves on success and rejects on error.
   * @see Fireproof#removeUser
   */
  self.removeUser = function(email, password) {

    self.accountChanging = true;

    return self.root.removeUser({ email: email, password: password })
    .then(accountPassHandler, accountErrorHandler);

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#changeEmail
   * @description Updates the email associated with an email / password user account.
   * @param {String} oldEmail
   * @param {String} newEmail
   * @param {String} password
   * @returns {Promise} that resolves on success and rejects on error.
   * @see Fireproof#changeEmail
   */
  self.changeEmail = function(oldEmail, newEmail, password) {

    self.accountChanging = true;

    return self.root.changeEmail({
      oldEmail: oldEmail,
      newEmail: newEmail,
      password: password
    })
    .then(accountPassHandler, accountErrorHandler);

  };


  /**
   * @ngdoc method
   * @name changePassword
   * @description Changes the password of an existing user using an email / password combination.
   * @param {String} email
   * @param {String} oldPassword
   * @param {String} newPassword
   * @returns {Promise} that resolves on success and rejects on error.
   * @see Fireproof#changePassword
   */
  self.changePassword = function(email, oldPassword, newPassword) {

    self.accountChanging = true;

    return self.root.changePassword({
      email: email,
      oldPassword: oldPassword,
      newPassword: newPassword
    })
    .then(accountPassHandler, accountErrorHandler);

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#resetPassword
   * @description Sends a password-reset email to the owner of the account,
   * containing a token that may be used to authenticate and change the user's password.
   * @param {String} email
   * @returns {Promise} that resolves on success and rejects on error.
   * @see Fireproof#resetPassword
   */
  self.resetPassword = function(email) {

    self.accountChanging = true;

    return self.root.resetPassword({ email: email })
    .then(accountPassHandler, accountErrorHandler);

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
      path = fpValidatePath(args);

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
      path = fpValidatePath(args);

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
      path = fpValidatePath(args);

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
      path = fpValidatePath(args);

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
      path = fpValidatePath(args);

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
      path = fpValidatePath(args);

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
      path = fpValidatePath(args);


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
      path = fpValidatePath(args);

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
      path = fpValidatePath(args);

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

    var path = fpValidatePath(Array.prototype.slice.call(arguments, 0));
    if (!path || !self.listenerSet) {
      return;
    }

    self.listenerSet.add(path);

    if (self.listenerSet.values.hasOwnProperty(path)) {
      return self.listenerSet.values[path];
    } else {
      return null;
    }

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#model
   * @description Use a Firebase path with ng-model.
   * @param {...string} pathPart Path components to be joined.
   * @returns {Function} a function that can be used in an ng-model expression
   * if ng-model-options has getterSetter: true.
   *
   * @example
   * ```html
   * <input name="firstname" ng-model="fp.model('users', user.id, 'firstName')" ng-model-options="{ getterSetter: true }">
   * ```
   */
  self.model = function() {

    var path = fpValidatePath(Array.prototype.slice.call(arguments, 0));
    return function(val) {

      // do nothing if we have no path or we aren't attached.
      if (!path || !self.listenerSet) {
        return;
      }

      if (angular.isDefined(val)) {
        // setter.
        return self.set(path, val);
      } else {

        // getter.
        self.listenerSet.add(path);

        if (self.listenerSet.values.hasOwnProperty(path)) {
          return self.listenerSet.values[path];
        } else {
          return null;
        }

      }

    };

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#priority
   * @description Gets a priority from Firebase and triggers scope refresh when that priority changes.
   * @param {...string} pathPart Path components to be joined.
   * @returns {*} `null` on the first scope digest, and the actual priority subsequently.
   */
  self.priority = function() {

    var path = fpValidatePath(Array.prototype.slice.call(arguments, 0));
    if (!path || !self.listenerSet) {
      return;
    }

    self.listenerSet.add(path);

    if (self.listenerSet.priorities.hasOwnProperty(path)) {
      return self.listenerSet.priorities[path];
    } else {
      return null;
    }

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#error
   * @description Gets the error associated with trying to read a specific path in Firebase.
   * @param {...string} pathPart Path components to be joined.
   * @returns {*} The error on trying to read the path, or `null` if there wasn't one.
   *
   * @example
   * ```html
   * <span>Welcome, {{ fp.val('users', userId, 'firstName') }}!</button>
   * ```
   */
  self.error = function() {

    var path = fpValidatePath(Array.prototype.slice.call(arguments, 0));

    if (path && self.listenerSet && self.listenerSet.errors.hasOwnProperty(path)) {
      return self.listenerSet.errors[path];
    } else {
      return null;
    }

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#path
   */
  self.path = function() {

    var path = fpValidatePath(Array.prototype.slice.call(arguments, 0));

    if (path) {
      return path;
    } else {
      return null;
    }

  };


  $scope.$on('$destroy', function() {

    // shut down controller
    self.detachFirebase();

  });

}


angular.module('flashpoint')
.controller('FirebaseCtl', FirebaseCtl);
