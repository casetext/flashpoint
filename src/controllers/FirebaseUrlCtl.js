angular.module('angular-fireproof.controllers.FirebaseUrlCtl', [
  'angular-fireproof.services.Fireproof',
  'angular-fireproof.services.status'
])
.controller('FirebaseUrlCtl', function(Firebase, Fireproof, $scope, $rootScope, $attrs) {

  var isRootScope = false;

  var authHandler = function(authData) {

    $scope.$auth = authData;
    if (isRootScope) {
      $rootScope.$auth = authData;
    }

    if ($attrs.onAuth) {
      $scope.$eval($attrs.onAuth, { '$auth': authData });
    }

  };


  var attachFireproof = function() {

    if ($scope.$fireproof) {
      $scope.$fireproof.offAuth(authHandler);
    }

    $scope.$fireproof = new Fireproof(new Firebase($attrs.firebaseUrl));
    $scope.$fireproof.onAuth(authHandler);

    // does rootScope have a Fireproof yet? if not, we're it
    if (!$rootScope.$fireproof) {
      isRootScope = true;
    }

    if (isRootScope) {
      $rootScope.$fireproof = $scope.$fireproof;
    }

  };


  $attrs.$observe('firebaseUrl', attachFireproof);
  if ($attrs.firebaseUrl) {
    attachFireproof();
  }

  $scope.$on('$destroy', function() {

    // detach onAuth listener.
    $scope.$fireproof.offAuth(authHandler);

  });

});
