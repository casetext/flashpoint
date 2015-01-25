
angular.module('flashpoint')
.value('fpLoadedTimeout', 20000)
.service('firebaseStatus', function(
  $interval,
  $timeout,
  $document,
  $animate,
  $rootScope,
  $log,
  Fireproof,
  fpLoadedTimeout
) {

  var service = this;

  function switchOff() {

    Fireproof.stats.off('finish', actionFinished);
    Fireproof.stats.off('error', actionErrored);
    $timeout.cancel(service._deadHand);

  }

  function actionFinished() {

    if (Fireproof.stats.runningOperationCount === 0) {

      switchOff();

      var operationList = [];
      for (var id in Fireproof.stats.operationLog) {
        operationList.push(Fireproof.stats.operationLog[id]);
      }

      operationList.sort(function(a, b) {
        return (a.start - b.start) || (a.end - b.end);
      });

      // set the "fp-loaded" attribute on the body
      $animate.setClass($document, 'fp-loaded', 'fp-loading');

      $rootScope.$broadcast('flashpointLoadSuccess', operationList);
      $rootScope.$evalAsync();

    }

  }

  function actionErrored(event) {

    switchOff();
    $rootScope.$broadcast('flashpointLoadError', event);

  }

  function reset() {

    Fireproof.stats.reset();
    Fireproof.stats.resetListeners();

  }

  service.startRoute = function() {

    reset();

    Fireproof.stats.on('finish', actionFinished);
    Fireproof.stats.on('error', actionErrored);

    // after the timeout period (20 seconds by default),
    // assume something's gone wrong and signal timeout.

    service._deadHand = $timeout(function() {

      switchOff();
      $rootScope.$broadcast('flashpointLoadTimeout');

    }, fpLoadedTimeout);

    $rootScope.$broadcast('flashpointLoadStart');
    $animate.addClass($document, 'fp-loading');

  };

  service.routeLinked = function() {

    // If no Firebase loads have started by this point, we assume that none will,
    // and notify load success.
    if (Fireproof.stats.runningOperationCount === 0 &&
      Fireproof.stats.listenCount === 0) {

      // set the "fp-loaded" attribute on the body
      $animate.setClass($document, 'fp-loaded', 'fp-loading');

      $rootScope.$broadcast('flashpointLoadSuccess', []);
      $rootScope.$evalAsync();

    }

  };


});
