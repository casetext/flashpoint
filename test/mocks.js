
angular.module('flashpoint.mocks.pump', ['flashpoint'])
.run(function(Fireproof, $rootScope, $interval) {

  // pump the root scope and flush intervals every 100 ms.
  setInterval(function() {
    $rootScope.$digest();
    $interval.flush(100);
  }, 100);

});
