
angular.module('angular-fireproof.controllers.FirebaseCtl', [
  'angular-fireproof.services.Fireproof',
  'angular-fireproof.services.status'
])
.controller('FirebaseCtl', function(
  $q,
  $scope,
  $attrs,
  Firebase,
  Fireproof
) {

  var self = this,
    userRef,
    userListener;

  var authErrorMessage = 'auth-handler is not set for this firebase. All ' +
    'authentication requests are therefore rejected.';

  self.login = function(options) {

    if ($attrs.loginHandler) {
      return $q.when($scope.$eval($attrs.loginHandler, { $root: self.root, $options: options }));
    } else {
      return $q.reject(new Error(authErrorMessage));
    }

  };

  function authHandler(authData) {

    if (userListener) {

      // detach any previous user listener.
      userRef.off('value', userListener);
      userRef = null;
      userListener = null;

    }

    self.auth = authData;

    $scope.$broadcast('angular-fireproof:auth', self.auth);

    // get the user's profile object, if one exists
    if (self.auth && self.auth.provider !== 'anonymous' && self.auth.uid && $attrs.profilePath) {

      userRef = self.root.child($attrs.profilePath).child(self.auth.uid);
      userListener = userRef.on('value', function(snap) {

        self.profile = snap.val();

        $scope.$broadcast('angular-fireproof:profile', self.profile);

      });

    } else {

      if (self.auth && self.auth.provider === 'custom' && self.auth.uid === null) {

        // superuser!
        self.profile = { super: true };

      } else {

        // nobody.
        self.profile = null;

      }

      $scope.$broadcast('angular-fireproof:profile', self.profile);

    }

  }


  function attachFireproof() {

    if (self.root) {

      // detach any remaining listeners here.
      self.root.offAuth(authHandler);
      self.root.off();

      // clear the profile and auth
      delete self.auth;
      delete self.profile;

    }

    self.root = new Fireproof(new Firebase($attrs.firebase));
    self.root.onAuth(authHandler);

  }


  $attrs.$observe('firebase', attachFireproof);

  // always run attach at least once
  if ($attrs.firebase) {
    attachFireproof();
  }


  $scope.$on('$destroy', function() {

    // detach onAuth listener.
    self.root.offAuth(authHandler);

    // detach all remaining listeners to prevent leaks.
    self.root.off();

    // help out GC.
    userRef = null;
    userListener = null;

  });

});
