
angular.module('angular-fireproof.controllers.FirebaseCtl', [
  'angular-fireproof.services.Fireproof',
  'angular-fireproof.services.status'
])
.controller('FirebaseCtl', function(
  $q,
  $scope,
  $attrs,
  Firebase
) {

  var self = this;

  var authErrorMessage = 'auth-handler is not set for this firebase. All ' +
    'authentication requests are therefore rejected.';


  self.login = function(options) {

    if ($attrs.loginHandler) {
      return $q.when($scope.$eval($attrs.loginHandler, { $root: self.root, $options: options }));
    } else {
      return $q.reject(new Error(authErrorMessage));
    }

  };

  self.logout = function(options) {

    if ($attrs.logoutHandler) {
      return $q.when($scope.$eval($attrs.logoutHandler, { $root: self.root, $options: options }));
    } else {
      self.root.unauth();
      return $q.when();
    }

  };

  $scope.$login = self.login;
  $scope.$logout = self.logout;


  function authHandler(authData) {

    setTimeout(function() {

      $scope.$apply(function() {

        self.auth = authData;
        $scope.$auth = authData;
        if (authData && authData.uid) {
          $scope.$userId = authData.uid;
        }

        if ($attrs.onAuthChange) {
          $scope.$evalAsync($attrs.onAuthChange);
        }

      });

    }, 0);

  }


  function cleanup() {

    // detach any remaining listeners here.
    self.root.offAuth(authHandler);

    // detach all listeners to prevent leaks.
    self.root.off();

    // clear auth data
    delete self.auth;
    delete $scope.$auth;
    delete $scope.$userId;

  }

  function attachFirebase() {

    if (self.root) {
      cleanup();

    }

    $scope.$auth = null;
    $scope.$userId = null;
    self.root = new Firebase($attrs.firebase);
    self.root.onAuth(authHandler);

  }


  $attrs.$observe('firebase', attachFirebase);

  // always run attach at least once
  if ($attrs.firebase) {
    attachFirebase();
  }

  $scope.$on('$destroy', cleanup);

});
