
angular.module('flashpoint')
.value('fpLoadedTimeout', 20000)
.service('firebaseStatus', function(
  $interval,
  $timeout,
  $document,
  $animate,
  $rootScope,
  $log,
  fpLoadedTimeout
) {

  var service = this;

  function reset() {

    service.operationCount = 0;
    service.operations = {
      'read': {},
      'transaction': {},
      'set': {},
      'setWithPriority': {},
      'setPriority': {},
      'update': {},
      'remove': {},
      'increment': {},
      'decrement': {}
    };
    service.operationLog = {};


  }

  reset();

  $rootScope.$on('$routeChangeStart', function() {
    reset();
  });

  $rootScope.$on('$viewContentLoaded', function() {

    $rootScope.$broadcast('flashpointLoading');
    $animate.addClass($document, 'fp-loading');

    // after 20 seconds, assume something's gone wrong and signal timeout.
    var deadHand = $timeout(function() {

      $interval.cancel(intervalId);
      $rootScope.$broadcast('flashpointTimeout');

    }, fpLoadedTimeout);

    // keep checking back to see if all Angular loading is done yet.
    var intervalId = $interval(function() {

      if (service.operationCount === 0) {

        $timeout.cancel(deadHand);
        $interval.cancel(intervalId);

        var operationList = Object.keys(service.operationLog)
        .reduce(function(list, id) {
          return list.concat(service.operationLog[id]);
        }, [])
        .sort(function(a, b) {
          return (a.start - b.start) || (a.end - b.end);
        });

        // set the "fp-loaded" attribute on the body
        $animate.setClass($document, 'fp-loaded', 'fp-loading');

        // broadcast the "flashpoint:loaded event" with load data
        $rootScope.$broadcast('flashpointLoaded', operationList);

      }

    }, 100);

  });

  service.start = function(event, ref) {

    var path = ref.toString();

    var id = Math.random().toString(36).slice(2);

    if (service.operations[event][path]) {
      service.operations[event][path]++;
    } else {
      service.operations[event][path] = 1;
    }

    service.operationCount++;
    service.operationLog[id] = {
      type: event,
      path: path,
      start: Date.now()
    };

    return id;

  };

  service.finish = function(id, err) {

    var logEvent = service.operationLog[id];

    if (!logEvent) {
      throw new Error('fp: reference to unknown log event', id);
    }

    if (!logEvent.end) {

      service.operationCount--;

      logEvent.count = 1;
      logEvent.end = Date.now();
      logEvent.duration = logEvent.end - logEvent.start;
      if (err) {
        logEvent.error = err;
      }

      $log.debug('fp: completed', logEvent.type, 'of',
        logEvent.path, 'in', logEvent.duration, 'ms');

      if (err) {
        $log.debug('fp: ' + logEvent.type + ' on path "' +
          logEvent.path + '" failed with error: "' +
          err.message + '"');
      }

    } else if (logEvent.type === 'read') {

      // reads can happen multiple times (i.e., because of an "on")
      if (err) {

        logEvent.errorAt = Date.now();
        logEvent.error = err;
        $log.debug('fp: read listener on path "' +
          logEvent.path + '" was terminated with error: "' +
          err.message + '"');

      } else {

        logEvent.count++;
        $log.debug('fp: read listener on', logEvent.path, 'has now gotten',
          logEvent.count, 'responses');

      }

    }

  };

});
