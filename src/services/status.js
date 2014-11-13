
angular.module('angular-fireproof.services.status', [])
.service('_fireproofStatus', function($timeout, $rootScope) {

  var service = this;

  function reset() {

    service.loaded = false;
    service.running = {};
    service.finished = {};

  }

  reset();

  service.start = function(path) {

    if (service.running[path]) {
      service.running[path]++;
    } else {
      service.running[path] = 1;
    }

  };

  service.finish = function(path) {

    if (!angular.isDefined(service.running[path])) {
      throw new Error('Path ' + path + ' is not actually running right now -- race condition?');
    }

    service.running[path]--;
    if (service.running[path] === 0) {

      delete service.running[path];
      service.finished[path] = true;

      $timeout(function() {

        // how many operations are left?
        var done = true;
        angular.forEach(service.running, function() {
          done = false;
        });

        if (done && !service.loaded) {

          service.loaded = true;
          // signal loaded
          $rootScope.$broadcast('angular-fireproof:loaded', service);

        }

      }, 10);

    }

  };

});
