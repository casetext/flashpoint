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
    isRootScope = false,
    userRef,
    userListener,
    profileListeners = [];

  var authErrorMessage = 'auth-handler is not set for this firebase. All ' +
    'authentication requests are therefore rejected.';

  self.login = function() {

    var authWait;

    if ($attrs.authHandler) {

      authWait = $q.when(
        $scope.$eval($attrs.authHandler, { $root: self.root }));

    } else {
      return $q.reject(new Error(authErrorMessage));
    }

    return authWait;

  };

  self.onProfile = function(cb) {

    profileListeners.push(cb);

    // always notify once immediately with whatever the current state is
    Fireproof._nextTick(function() {
      cb(self.profile);
    });

  };

  self.offProfile = function(cb) {

    var index = profileListeners.indexOf(cb);
    if (index !== -1) {
      self._profileListeners.splice(cb, 1);
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
    $scope.$auth = authData;
    if (isRootScope) {
      $rootScope.$auth = authData;
    }

    // get the user's profile object, if one exists
    if (self.auth && self.auth.provider !== 'anonymous' && $attrs.profilePath) {

      userRef = self.fireproof.child($attrs.profilePath);
      userListener = userRef.on('value', function(snap) {

        self.profile = snap.val();
        $scope.$profile = snap.val();

        notifyProfileListeners();

      });

    } else {

      self.profile = null;
      $scope.$profile = null;

      notifyProfileListeners();

    }

  }


  function attachFireproof() {

    if (self.root) {

      // detach any remaining listeners here.
      self.root.offAuth(authHandler);
      self.root.off();

      // clear the profile and
      self.profile = null;
      $scope.$profile = null;

      notifyProfileListeners();

    }

    self.root = new Fireproof(new Firebase($attrs.firebase));
    self.root.onAuth(authHandler);

    $scope.$fireproof = self.root;

  }


  $attrs.$observe('firebase', attachFireproof);
  if ($attrs.firebase) {
    attachFireproof();
  }

  $scope.$on('$destroy', function() {

    // detach onAuth listener.
    self.$fireproof.offAuth(authHandler);

    // detach all remaining listeners to prevent leaks.
    self.$fireproof.off();

    // help out GC.
    userRef = null;
    userListener = null;

  });

});
