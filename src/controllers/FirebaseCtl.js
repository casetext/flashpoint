angular.module('angular-fireproof.controllers.FirebaseCtl', [
  'angular-fireproof.services.Fireproof',
  'angular-fireproof.services.status'
])
.controller('FirebaseCtl', function(Firebase, Fireproof, $scope, $rootScope, $attrs) {

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

    self.root = new Fireproof(new Firebase($attrs.firebase));
    self.root.onAuth(authHandler);
    $scope.$fireproof = self.root;

  };


  $attrs.$observe('firebase', attachFireproof);
  if ($attrs.firebase) {
    attachFireproof();
  }

  $scope.$on('$destroy', function() {

    // detach onAuth listener.
    self.$fireproof.offAuth(authHandler);

  });

});
