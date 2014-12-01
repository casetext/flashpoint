
angular.module('flashpoint')
.service('_firebaseStatus', function(
  $timeout,
  $document,
  $animate,
  $rootScope,
  $log
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

  service.start = function(ref, event) {

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

    service.operationCount--;

    var logEvent = service.operationLog[id];
    logEvent.end = Date.now();
    logEvent.duration = logEvent.end - logEvent.start;
    if (err) {
      logEvent.error = err;
    }

    $log.debug('fp: completed', id, 'in', logEvent.duration);
    if (err) {
      $log.debug('fp: ' + logEvent.type + ' on path "' +
        logEvent.path + '" failed with error: "' +
        err.message + '"');
    }

    if (service.operationCount === 0) {

      if (service.timeout) {
        $timeout.cancel(service.timeout);
      }

      // wait 75 ms, then assume we're all done loading
      service.timeout = $timeout(function() {

        if (service.operationCount === 0) {

          var operationList = Object.keys(service.operationLog)
          .reduce(function(list, id) {
            return list.concat(service.operationLog[id]);
          }, [])
          .sort(function(a, b) {
            return (a.start - b.start) || (a.end - b.end);
          });

          // set the "fp-loaded" attribute on the body
          $animate.addClass($document, 'fp-loaded');

          // broadcast the "flashpoint:loaded event" with load data
          $rootScope.$broadcast(
            'flashpoint:loaded',
            service.operations,
            operationList);

        }

      }, 75);

    }

  };

});
