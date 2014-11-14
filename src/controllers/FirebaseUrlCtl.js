angular.module('angular-fireproof.controllers.FirebaseUrlCtl', [
  'angular-fireproof.services.Fireproof',
  'angular-fireproof.services.status'
])
.controller('FirebaseUrlCtl', function(Firebase, Fireproof, $scope, $rootScope, $attrs) {

  var self = this,
    isRootScope = false;

  var authHandler = function(authData) {

    self.$auth = authData;
    $scope.$auth = authData;
    if (isRootScope) {
      $rootScope.$auth = authData;
    }

    if ($attrs.onAuth) {
      $scope.$eval($attrs.onAuth, { '$auth': authData });
    }

  };


  var attachFireproof = function() {

    if (self.root) {
      self.root.offAuth(authHandler);
    }

    self.root = new Fireproof(new Firebase($attrs.firebaseUrl));
    self.root.onAuth(authHandler);
    $scope.$fireproof = self.root;

  };


  $attrs.$observe('firebaseUrl', attachFireproof);
  if ($attrs.firebaseUrl) {
    attachFireproof();
  }

  $scope.$on('$destroy', function() {

    // detach onAuth listener.
    self.$fireproof.offAuth(authHandler);

  });

});
