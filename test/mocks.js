
angular.module('flashpoint.mocks', [
  'flashpoint'
])
.run(function(Fireproof, $rootScope, $interval) {

  Fireproof.setNextTick(function(fn) {

    setTimeout(function() {
      $rootScope.$apply(fn);
    }, 0);

  });

  // pump the root scope and flush intervals every 100 ms.
  setInterval(function() {
    $rootScope.$digest();
    $interval.flush(100);
  }, 100);

});
