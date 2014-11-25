
angular.module('angular-firebase.mocks', [
  'angular-fireproof.services.Fireproof'
])
.run(function(Fireproof, $rootScope) {

  Fireproof.setNextTick(function(fn) {

    setTimeout(function() {
      $rootScope.$apply(fn);
    }, 0);

  });

});
