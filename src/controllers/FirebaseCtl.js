
angular.module('angular-fireproof')
.controller('FirebaseCtl', function($q, Firebase) {

  /**
   * @ngdoc type
   * @name FirebaseCtl
   * @module angular-fireproof
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
