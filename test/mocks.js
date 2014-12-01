
angular.module('flashpoint.mocks', [
  'flashpoint'
])
.run(function(Fireproof, $rootScope) {

  Fireproof.setNextTick(function(fn) {

    setTimeout(function() {
      $rootScope.$apply(fn);
    }, 0);

  });

  // pump the root scope every 100 ms.
  setInterval(function() {
    $rootScope.$digest();
  }, 100);

});
