
angular.module('angular-fireproof.controllers.PageCtl', [
  'angular-fireproof.services.Fireproof',
  'angular-fireproof.services.status'
])
.controller('PageCtl', function($scope, $attrs, $timeout, $q, _fireproofStatus, Fireproof) {

  var ref, currentSnaps, pager, paging;


  function handleSnaps(snaps) {

    currentSnaps = snaps;

    if (snaps.length > 0) {

      $scope[$attrs.as] = snaps.map(function(snap) {
        return snap.val();
      });

      if ($attrs.onPage) {
        $scope.$eval($attrs.onPage, { '$snaps': snaps });
      }

    }

    return snaps;

  }


  function handleError(err) {

    if ($attrs.onError) {
      $scope.$eval($attrs.onError, { 'error': err });
    } else {
      throw err;
    }

  }


  $scope.$next = function() {

    if ($scope.$hasNext && !paging) {

      paging = true;
      $attrs.$addClass('paging');

      var limit;
      if ($attrs.limit) {
        limit = parseInt($scope.$eval($attrs.limit));
      } else {
        limit = 5;
      }

      var lastSnap = currentSnaps[currentSnaps.length-1];
      pager.setPosition(lastSnap.getPriority(), lastSnap.name());

      return pager.next(limit)
      .then(handleSnaps, handleError)
      .then(function(snaps) {

        paging = false;
        $attrs.removeClass('paging');

        $scope.$hasPrevious = true;
        $scope.$hasNext = snaps.length > 0;
        return snaps;

      });

    } else {
      return $q.reject(new Error('cannot call $next from here, no more objects'));
    }

  };


  $scope.$previous = function() {

    // set position to the first item in the current list
    if ($scope.$hasPrevious && !paging) {

      paging = true;
      $attrs.$addClass('paging');

      var limit;
      if ($attrs.limit) {
        limit = parseInt($scope.$eval($attrs.limit));
      } else {
        limit = 5;
      }

      var firstSnap = currentSnaps[0];
      pager.setPosition(firstSnap.getPriority(), firstSnap.name());

      return pager.previous(limit)
      .then(handleSnaps)
      .then(function(snaps) {

        paging = false;
        $attrs.removeClass('paging');

        $scope.hasNext = true;
        $scope.hasPrevious = snaps.length > 0;
        return snaps;

      });

    } else {
      return $q.reject(new Error('cannot call $next from here, no more objects'));
    }


  };


  $scope.$reset = function() {

    // create the pager.
    pager = new Fireproof.Pager(ref);

    if ($attrs.startAt) {
      pager.setPosition($scope.$eval($attrs.startAt));
    }

    // pull the first round of results out of the pager.
    return $scope.$next();

  };


  $attrs.$observe('fpPage', function(path) {

    if (path[path.length-1] === '/') {
      // this is an incomplete eval. we're done.
      return;
    } else if (!$scope.$fireproof) {
      throw new Error('No $fireproof on this scope. Maybe you forgot firebase-url?');
    } else if (!$attrs.as) {
      throw new Error('Missing "as" attribute on fp-page="' + $attrs.fpPage + '"');
    }

    ref = $scope.$fireproof.child(path);

    // shut down everything.
    return $scope.$reset();

  });


  $scope.$on('$destroy', function() {

    // if this scope object is destroyed, finalize the controller

    // finalize as a favor to GC
    ref = null;
    pager = null;
    currentSnaps = null;

  });

});
