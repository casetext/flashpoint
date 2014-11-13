
(function (root, factory) {

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['angular'], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    factory(require('angular'), require('firebase'), require('fireproof'));
  } else {
    // Browser globals (root is window)
    factory(root.angular, root.Firebase, root.Fireproof);
  }

}(this, function (angular, Firebase, Fireproof) {

  'use strict';
    
  angular.module('angular-fireproof', [
  
  ]);
  
  
  angular.module('angular-fireproof.controllers.BindCtl', [
    'angular-fireproof.services.Fireproof',
    'angular-fireproof.services.status'
  ])
  .controller('BindCtl', function($scope, $attrs, $interval, _fireproofStatus) {
  
    var ref, fpWatcher, scopeWatchCancel, currentSnap, firstLoad;
  
    function loadOK(snap) {
  
      if (scopeWatchCancel) {
        scopeWatchCancel();
      }
  
      currentSnap = snap;
  
      if (!firstLoad) {
        firstLoad = true;
        _fireproofStatus.finish(ref.toString());
      }
  
      delete $scope.$fireproofError;
      $scope[$attrs.as] = currentSnap.val();
  
      if ($attrs.sync) {
  
        scopeWatchCancel = $scope.$watch($attrs.as, function(newVal) {
  
          if (newVal !== undefined && !angular.equals(newVal, currentSnap.val())) {
            $scope.$sync(newVal);
          }
  
        });
  
      }
  
      if ($attrs.onLoad) {
         $scope.$eval($attrs.onLoad, { '$snap': snap });
      }
  
      $scope.$syncing = false;
  
    }
  
  
    function loadError(err) {
  
      currentSnap = null;
  
      if (!firstLoad) {
        firstLoad = true;
        _fireproofStatus.finish(ref.toString());
      }
  
      $scope.$fireproofError = err;
      $scope.syncing = false;
  
      var code = err.code.toLowerCase().replace(/[^a-z]/g, '-');
      var lookup = $attrs.$attr['on-' + code];
  
      if ($attrs[lookup]) {
        $scope.$eval($attrs[lookup], { '$error': err });
      } else if ($attrs.onError) {
        $scope.$eval($attrs.onError, { '$error': err });
      }
  
  
    }
  
  
    $scope.$reload = function() {
  
      if (!$scope.$syncing) {
  
        firstLoad = false;
  
        delete $scope.$fireproofError;
        $scope.$syncing = true;
  
        if (fpWatcher) {
          ref.off('value', fpWatcher);
        }
  
        if (scopeWatchCancel) {
          scopeWatchCancel();
        }
  
        _fireproofStatus.start(ref.toString());
  
        if ($attrs.watch) {
          fpWatcher = ref.on('value', loadOK, loadError);
        } else {
          ref.once('value', loadOK, loadError);
        }
  
      }
  
    };
  
  
    // this function is a no-op if sync is set.
    $scope.$revert = function() {
  
      if (!$attrs.sync && currentSnap) {
        $scope[$attrs.as] = currentSnap.val();
      }
  
    };
  
  
    $scope.$sync = function() {
  
      if (!$scope.$syncing) {
  
        $scope.$syncing = true;
        delete $scope.$fireproofError;
  
        return ref.set($scope[$attrs.as])
        .then(function() {
  
          if ($attrs.onSave) {
            $scope.$eval($attrs.onSave);
          }
  
        })
        .catch(function(err) {
  
          $scope.$fireproofError = err;
  
          var code = err.code.toLowerCase().replace(/[^a-z]/g, '-');
          var lookup = $attrs.$attr['on-' + code];
  
          if ($attrs[lookup]) {
            $scope.$eval($attrs[lookup], { '$error': err });
          } else if ($attrs.onError) {
            $scope.$eval($attrs.onError, { '$error': err });
          }
  
        })
        .finally(function() {
          $scope.$syncing = false;
        });
  
      }
  
    };
  
  
    $attrs.$observe('fpBind', function(path) {
  
      delete $scope.$fireproofError;
  
      if (path[path.length-1] === '/') {
        // this is an incomplete eval. we're done.
        return;
      } else if (!$scope.$fireproof) {
        throw new Error('No $fireproof on this scope. Maybe you forgot firebase-url?');
      } else if (!$attrs.as) {
        throw new Error('Missing "as" attribute on fp-bind="' + $attrs.fpBind + '"');
      }
  
      // shut down everything.
  
      if (scopeWatchCancel) {
        scopeWatchCancel();
      }
  
      ref = $scope.$fireproof.child(path);
      $scope.$reload();
  
  
    });
  
    $scope.$on('$destroy', function() {
  
      // if this scope object is destroyed, finalize the controller and
      // cancel the Firebase watcher if one exists
  
      if (fpWatcher) {
        ref.off('value', fpWatcher);
      }
  
      if (scopeWatchCancel) {
        scopeWatchCancel();
      }
  
      // finalize as a favor to GC
      fpWatcher = null;
      ref = null;
      scopeWatchCancel = null;
      currentSnap = null;
  
    });
  
  });
  
  
  angular.module('angular-fireproof.controllers.PageCtl', [
    'angular-fireproof.services.Fireproof',
    'angular-fireproof.services.status'
  ])
  .controller('PageCtl', function($scope, $attrs, $timeout, $q, _fireproofStatus, Fireproof) {
  
    var ref, currentSnaps, pager, paging;
  
  
    function handleSnaps(snaps) {
  
      paging = false;
      currentSnaps = snaps;
  
      if (snaps.length > 0) {
  
        $scope[$attrs.as] = snaps.map(function(snap) {
          return snap.val();
        });
  
        $scope[$attrs.as].$keys = snaps.map(function(snap) {
          return snap.name();
        });
  
        $scope[$attrs.as].$priorities = snaps.map(function(snap) {
          return snap.getPriority();
        });
  
        $scope[$attrs.as].$next = function() {
          $scope.$next();
        };
  
        $scope[$attrs.as].$previous = function() {
          $scope.$previous();
        };
  
        $scope[$attrs.as].$reset = function() {
          $scope.$reset();
        };
  
        if ($attrs.onPage) {
          $scope.$eval($attrs.onPage, { '$snaps': snaps });
        }
  
      }
  
      return snaps;
  
    }
  
  
    function handleError(err) {
  
      paging = false;
  
      var code = err.code.toLowerCase().replace(/[^a-z]/g, '-');
      var lookup = $attrs.$attr['on-' + code];
  
      if ($attrs[lookup]) {
        $scope.$eval($attrs[lookup], { '$error': err });
      } else if ($attrs.onError) {
        $scope.$eval($attrs.onError, { '$error': err });
      }
  
    }
  
  
    $scope.$next = function() {
  
      if ($scope.$hasNext && !paging) {
  
        paging = true;
  
        var limit;
        if ($attrs.limit) {
          limit = parseInt($scope.$eval($attrs.limit));
        } else {
          limit = 5;
        }
  
        if (currentSnaps) {
          var lastSnap = currentSnaps[currentSnaps.length-1];
          pager.setPosition(lastSnap.getPriority(), lastSnap.name());
        }
  
        return pager.next(limit)
        .then(handleSnaps, handleError)
        .then(function(snaps) {
  
          $scope.$hasPrevious = true;
          $scope.$hasNext = snaps.length > 0;
  
          return snaps;
  
        });
  
      } else if (paging) {
        return $q.reject(new Error('cannot call $next from here, no more objects'));
      } else {
        return $q.reject(new Error('cannot call $next from here, no more objects'));
      }
  
    };
  
  
    $scope.$previous = function() {
  
      // set position to the first item in the current list
      if ($scope.$hasPrevious && !paging) {
  
        paging = true;
  
        var limit;
        if ($attrs.limit) {
          limit = parseInt($scope.$eval($attrs.limit));
        } else {
          limit = 5;
        }
  
  
        if (currentSnaps && currentSnaps.length > 0) {
          var firstSnap = currentSnaps[0];
          pager.setPosition(firstSnap.getPriority(), firstSnap.name());
        }
  
        return pager.previous(limit)
        .then(handleSnaps, handleError)
        .then(function(snaps) {
  
          $scope.$hasNext = true;
          $scope.$hasPrevious = snaps.length > 0;
          return snaps;
  
        });
  
      } else {
        return $q.reject(new Error('cannot call $next from here, no more objects'));
      }
  
  
    };
  
  
    $scope.$reset = function() {
  
      $scope.$hasNext = true;
      $scope.$hasPrevious = true;
  
      currentSnaps = null;
  
      // create the pager.
      pager = new Fireproof.Pager(ref);
  
      if ($attrs.startAtPriority && $attrs.startAtName) {
  
        pager.setPosition(
          $scope.$eval($attrs.startAtPriority),
          $scope.$eval($attrs.startAtName));
  
      } else if ($attrs.startAtPriority) {
        pager.setPosition($scope.$eval($attrs.startAtPriority));
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
      $scope.$reset();
  
    });
  
  
    $scope.$on('$destroy', function() {
  
      // if this scope object is destroyed, finalize the controller
      ref = null;
      pager = null;
      currentSnaps = null;
  
    });
  
  });
  
  
  angular.module('angular-fireproof.directives.firebaseUrl', [
    'angular-fireproof.services.Fireproof'
  ])
  .directive('firebaseUrl', function(Firebase, Fireproof) {
  
    return {
  
      restrict: 'A',
      scope: true,
      priority: 10,
      link: { pre: function(scope, el, attrs) {
  
        var authHandler = function(authData) {
  
          scope.$auth = authData;
          if (attrs.onAuth) {
            scope.$eval(attrs.onAuth, { '$auth': authData });
          }
  
        };
  
  
        var attachFireproof = function() {
  
          if (scope.$fireproof) {
            scope.$fireproof.offAuth(authHandler);
          }
  
          scope.$fireproof = new Fireproof(new Firebase(attrs.firebaseUrl));
          scope.$fireproof.onAuth(authHandler);
  
        };
  
  
        attrs.$observe('firebaseUrl', attachFireproof);
        if (attrs.firebaseUrl) {
          attachFireproof();
        }
  
        scope.$on('$destroy', function() {
  
          // detach onAuth listener.
          scope.$fireproof.offAuth(authHandler);
  
        });
  
      }}
  
    };
  
  });
  
  
  
  angular.module('angular-fireproof.directives.fpBind', [
    'angular-fireproof.controllers.BindCtl'
  ])
  .directive('fpBind', function() {
  
    return {
      restrict: 'A',
      scope: true,
      controller: 'BindCtl',
      link: function(scope, el) {
  
        scope.$watch('$syncing', function(syncing) {
  
          if (syncing) {
            el.addClass('syncing');
          } else {
            el.removeClass('syncing');
          }
  
        });
  
        scope.$watch('$fireproofError', function(error, oldError) {
  
          var code;
  
          if (oldError) {
            code = oldError.code.toLowerCase().replace(/\W/g, '-');
            el.removeClass('fireproof-error-' + code);
          }
  
          if (error) {
            code = error.code.toLowerCase().replace(/\W/g, '-');
            el.addClass('fireproof-error-' + code);
          }
  
        });
  
      }
  
    };
  
  });
  
  
  
  angular.module('angular-fireproof.directives.fpPage', [
    'angular-fireproof.controllers.PageCtl'
  ])
  .directive('fpPage', function() {
  
    return {
      restrict: 'A',
      scope: true,
      controller: 'PageCtl',
      link: function(scope, el) {
  
        scope.$watch('$syncing', function(syncing) {
  
          if (syncing) {
            el.addClass('syncing');
          } else {
            el.removeClass('syncing');
          }
  
        });
  
        scope.$watch('$fireproofError', function(error, oldError) {
  
          if (oldError) {
            el.removeClass('fireproof-error-' + oldError.code);
          }
  
          if (error) {
            el.addClass('fireproof-error-' + error.code);
          }
  
        });
  
      }
  
    };
  
  });
  
  
  
  angular.module('angular-fireproof.services.Fireproof', [])
  .factory('Firebase', function($window) {
    return $window.Firebase;
  })
  .factory('Fireproof', function($window, $timeout, $q) {
  
    $window.Fireproof.setNextTick($timeout);
    $window.Fireproof.bless($q);
  
    return $window.Fireproof;
  
  });
  
  
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
  

}));
