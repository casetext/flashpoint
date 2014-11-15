
angular.module('angular-fireproof.controllers.FirebaseCtl', [
  'angular-fireproof.services.Fireproof',
  'angular-fireproof.services.status'
])
.controller('FirebaseCtl', function(
  $q,
  Firebase,
  Fireproof,
  $scope,
  $rootScope,
  $attrs
) {

  var self = this,
    userRef,
    userListener,
    profileListeners = [];

  var authErrorMessage = 'auth-handler is not set for this firebase. All ' +
    'authentication requests are therefore rejected.';

  self.login = function(options) {

    if ($attrs.loginHandler) {
      return $q.when($scope.$eval($attrs.loginHandler, { $root: self.root, $options: options }));
    } else {
      return $q.reject(new Error(authErrorMessage));
    }

  };

  self.onProfile = function(cb) {

    profileListeners.push(cb);

    // always notify once immediately with whatever the current state is
    Fireproof._nextTick(function() {
      cb(self.profile);
    });

  };

  self.offProfile = function(cb) {

    if (profileListeners && profileListeners.length > 0) {

      var index = profileListeners.indexOf(cb);
      if (index !== -1) {
        profileListeners.splice(cb, 1);
      }

    }

  };

  function notifyProfileListeners() {

    profileListeners.forEach(function(cb) {

      Fireproof._nextTick(function() {
        cb(self.profile);
      });

    });

  }

  function authHandler(authData) {

    if (userListener) {

      // detach any previous user listener.
      userRef.off('value', userListener);
      userRef = null;
      userListener = null;

    }

    self.auth = authData;

    // get the user's profile object, if one exists
    if (self.auth && self.auth.provider !== 'anonymous' && self.auth.uid && $attrs.profilePath) {

      userRef = self.root.child($attrs.profilePath).child(self.auth.uid);
      userListener = userRef.on('value', function(snap) {

        self.profile = snap.val();

        notifyProfileListeners();

      });

    } else {

      if (self.auth && self.auth.provider === 'custom' && self.auth.uid === null) {

        // superuser!
        self.profile = { super: true };

      } else {

        // nobody.
        self.profile = null;

      }

      notifyProfileListeners();

    }

  }


  function attachFireproof() {

    if (self.root) {

      // detach any remaining listeners here.
      self.root.offAuth(authHandler);
      self.root.off();

      // clear the profile
      self.profile = null;

      notifyProfileListeners();

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

    // remove all onProfile listeners.
    profileListeners = null;

    // detach onAuth listener.
    self.root.offAuth(authHandler);

    // detach all remaining listeners to prevent leaks.
    self.root.off();

    // help out GC.
    userRef = null;
    userListener = null;

  });

});
