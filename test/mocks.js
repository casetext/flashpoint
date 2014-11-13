
angular.module('angular-firebase.mocks', [
  'angular-fireproof.services.Fireproof'
])
.run(function(Fireproof, $rootScope) {

  Fireproof.setNextTick(function(fn) {

    setTimeout(function() {

      $rootScope.$digest();
      setTimeout(function() {
        $rootScope.$apply(fn);
      }, 0);

    }, 0);

  });

});
