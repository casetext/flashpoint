
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
  ListenerSet) {

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

  var self = this;

  self.auth = null;

  function authHandler(authData) {

    if (self.listenerSet) {
      self.listenerSet.clear();
    }

    self.auth = authData;

    $scope.$evalAsync();

  }


  /**
   * @ngdoc method
   * @name FirebaseCtl#cleanup
   * @description Removes and detaches all connections to Firebase used by
   * this controller.
   */
  self.cleanup = function() {

    // detach all watchers
    if (self.listenerSet) {

      self.listenerSet.clear();
      delete self.listenerSet;

    }

    // detach any remaining listeners here.
    self.root.offAuth(authHandler);

    // detach all listeners to prevent leaks.
    self.root.off();

    // remove the actual root object itself, as it's now invalid.
    delete self.root;

    // clear auth data.
    delete self.auth;

    $scope.$evalAsync();

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

    self.listenerSet = new ListenerSet(self.root, $scope);
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

    self.listenerSet.add(path);

    if (self.listenerSet.values.hasOwnProperty(path)) {
      return self.listenerSet.values[path];
    } else {
      return null;
    }

  };


  /**
   * @ngdoc method
   * @name FirebaseCtl#priority
   * @description Gets a priority from Firebase and triggers scope refresh when that priority changes.
   * @param {...string} pathPart Path components to be joined.
   * @returns {*} `null` on the first scope digest, and the actual priority subsequently.
   */
  self.priority = function() {

    var path = validatePath(Array.prototype.slice.call(arguments, 0));
    if (!path) {
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

    var path = validatePath(Array.prototype.slice.call(arguments, 0));

    if (path && self.listenerSet.errors.hasOwnProperty(path)) {
      return self.listenerSet.errors[path];
    } else {
      return null;
    }

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
   *   <li ng-repeat="user in fp.children().orderByChild('lastName').startAt('B').endAt('Bz').of('users').values">
   *      <span>{{ user.firstName }} {{ user.lastName }} is a user whose last name starts with B!</span>
   *   </li>
   * </ul>
   * ```
   */
  self.children = function() {
    return new ChildQuery(self.listenerSet);
  };


  $scope.$on('$destroy', function() {

    // shut down controller
    self.cleanup();

  });

}


angular.module('flashpoint')
.controller('FirebaseCtl', FirebaseCtl);
