
(function (root, factory) {

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['angular', 'firebase', 'fireproof'], factory);
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
    'angular-fireproof.services.Fireproof',
    'angular-fireproof.services.status',
    'angular-fireproof.directives.firebase',
    'angular-fireproof.directives.fp',
    'angular-fireproof.directives.fpBind',
    'angular-fireproof.directives.fpPage',
    'angular-fireproof.directives.loginClick'
  ]);
  
  
  angular.module('angular-fireproof.controllers.FirebaseCtl', [
    'angular-fireproof.services.Fireproof',
    'angular-fireproof.services.status'
  ])
  .controller('FirebaseCtl', function(
    $q,
    $scope,
    $attrs,
    Firebase
  ) {
  
    var self = this;
  
    var authErrorMessage = 'auth-handler is not set for this firebase. All ' +
      'authentication requests are therefore rejected.';
  
  
    self.login = function(options) {
  
      if ($attrs.loginHandler) {
        return $q.when($scope.$eval($attrs.loginHandler, { $root: self.root, $options: options }));
      } else {
        return $q.reject(new Error(authErrorMessage));
      }
  
    };
  
    self.logout = function(options) {
  
      if ($attrs.logoutHandler) {
        return $q.when($scope.$eval($attrs.logoutHandler, { $root: self.root, $options: options }));
      } else {
        self.root.unauth();
        return $q.when();
      }
  
    };
  
    $scope.$login = self.login;
    $scope.$logout = self.logout;
  
  
    function authHandler(authData) {
  
      setTimeout(function() {
  
        $scope.$apply(function() {
  
          self.auth = authData;
          $scope.$auth = authData;
          if (authData && authData.uid) {
            $scope.$userId = authData.uid;
          }
  
          if ($attrs.onAuthChange) {
            $scope.$evalAsync($attrs.onAuthChange);
          }
  
        });
  
      }, 0);
  
    }
  
  
    function cleanup() {
  
      // detach any remaining listeners here.
      self.root.offAuth(authHandler);
  
      // detach all listeners to prevent leaks.
      self.root.off();
  
      // clear auth data
      delete self.auth;
      delete $scope.$auth;
      delete $scope.$userId;
  
    }
  
    function attachFirebase() {
  
      if (self.root) {
        cleanup();
  
      }
  
      $scope.$auth = null;
      $scope.$userId = null;
      self.root = new Firebase($attrs.firebase);
      self.root.onAuth(authHandler);
  
    }
  
  
    $attrs.$observe('firebase', attachFirebase);
  
    // always run attach at least once
    if ($attrs.firebase) {
      attachFirebase();
    }
  
    $scope.$on('$destroy', cleanup);
  
  });
  
  
  angular.module('angular-fireproof.directives.firebase', [
    'angular-fireproof.controllers.FirebaseCtl',
    'angular-fireproof.services.Fireproof'
  ])
  .directive('firebase', function() {
  
    return {
  
      restrict: 'A',
      scope: true,
      controller: 'FirebaseCtl',
      link: function(scope, el, attrs, firebase) {
  
        var watchers = {},
          values = {};
  
  
        var validatePath = function(pathParts) {
  
          // check the arguments
          var path = pathParts.join('/');
  
          if (pathParts.length === 0 || path === '' ||
            pathParts.indexOf(null) !== -1 || pathParts.indexOf(undefined) !== -1) {
  
            // if any one of them is null/undefined, this is not a valid path
            return null;
  
          } else {
            return path;
          }
  
        };
  
  
        scope.$val = function() {
  
          var path = validatePath(Array.prototype.slice.call(arguments, 0));
          if (!path) {
            return;
          }
  
          if (!watchers[path]) {
  
            values[path] = null;
            watchers[path] = firebase.root.child(path)
            .on('value', function(snap) {
  
              setTimeout(function() {
  
                scope.$apply(function() {
  
                  values[path] = snap.val();
  
                  if (attrs.onChange) {
                    scope.$eval(attrs.onChange, { $path: path });
                  }
  
                });
  
              }, 0);
  
            });
  
          }
  
          return values[path];
  
        };
  
        scope.$set = function() {
  
          // check the arguments
          var args = Array.prototype.slice.call(arguments, 0),
            value = args.pop(),
            path = validatePath(args);
  
          var closure = function() {
  
            if (!path) {
              return;
            }
  
            return new Fireproof(firebase.root).child(path).set(value);
  
          };
  
          closure.now = function() {
            return closure();
          };
  
          return closure;
  
        };
  
  
        scope.$setWithPriority = function() {
  
          // check the arguments
          var args = Array.prototype.slice.call(arguments, 0),
            priority = args.pop(),
            value = args.pop(),
            path = validatePath(args);
  
          var closure = function() {
  
            if (!path) {
              return;
            }
  
            return new Fireproof(firebase.root).child(path)
            .setWithPriority(value, priority);
  
          };
  
          closure.now = function() {
            return closure();
          };
  
        };
  
  
        scope.$update = function() {
  
          // check the arguments
          var args = Array.prototype.slice.call(arguments, 0),
            value = args.pop(),
            path = validatePath(args);
  
          var closure = function() {
  
            if (!path) {
              return;
            }
  
            return new Fireproof(firebase.root).child(path).update(value);
  
          };
  
          closure.now = function() {
            return closure();
          };
  
          return closure;
  
        };
  
  
        scope.$on('$destroy', function() {
  
          // remove all listeners
          angular.forEach(watchers, function(watcher, path) {
            firebase.root.child(path).off('value', watcher);
          });
  
        });
  
      }
  
    };
  
  });
  
  
  
  angular.module('angular-fireproof.directives.fpBind', [
    'angular-fireproof.directives.firebase',
    'angular-fireproof.services.status'
  ])
  .directive('fpBind', function() {
  
    return {
  
      restrict: 'A',
      scope: true,
      require: '^firebase',
      link: function(scope, el, attrs, firebase) {
  
        var ref, snap, listener, removeScopeListener;
  
        scope.$attached = false;
        scope.$syncing = false;
  
  
        var setError = function(err) {
  
          scope.$error = err;
          if (attrs.onError) {
            scope.$evalAsync(attrs.onError);
          }
  
        };
  
  
        scope.$revert = function() {
  
          if (scope.$attached) {
            scope.$detach();
            scope.$attached = false;
          }
  
          scope.$attach();
  
        };
  
  
        scope.$sync = function() {
  
          if (!scope.$syncing) {
  
            scope.$syncing = true;
  
            var value = scope[attrs.as || '$val'];
            if (value === undefined) {
              value = null;
            }
  
            var priority = scope.$priority;
            if (priority === undefined) {
              priority = null;
            }
  
            if (value !== snap.val() || priority !== snap.getPriority()) {
  
              ref.setWithPriority(value, priority, function(err) {
  
                setTimeout(function() { scope.$apply(function() {
  
                  if (err) {
                    setError(err);
                  }
  
                }); }, 0);
  
              });
  
            }
  
          }
  
        };
  
        scope.$detach = function() {
  
          if (listener) {
            ref.off('value', listener);
          }
  
          if (removeScopeListener) {
            removeScopeListener();
          }
  
          scope.$attached = false;
  
        };
  
  
        scope.$attach = function() {
  
          listener = ref.on('value', function(newSnap) {
  
            setTimeout(function() { scope.$apply(function() {
  
              snap = newSnap;
  
              if (!scope.$attached) {
                scope.$attached = true;
              }
  
              if (removeScopeListener) {
                removeScopeListener();
              }
  
              scope.$name = snap.name();
              scope.$val = snap.val();
              scope.$priority = snap.getPriority();
  
              if (attrs.as) {
                scope[attrs.as] = snap.val();
              }
  
              if (attrs.onLoad) {
                scope.$evalAsync(attrs.onLoad);
              }
  
              if (scope.$syncing) {
                scope.$syncing = false;
  
                if (attrs.onSync) {
                  scope.$evalAsync(attrs.onSync);
                }
  
              }
  
              if (attrs.autosync) {
  
                var watchExpression = '{ ' +
                  'value: ' + (attrs.as || '$val') + ',' +
                  'priority: $priority' +
                  ' }';
  
                removeScopeListener = scope.$watch(watchExpression, function() {
                  scope.$sync();
                }, true);
  
              }
  
            }); }, 0);
  
          }, function(err) {
  
            setTimeout(function() { scope.$apply(function() {
  
              scope.$detach();
              setError(err);
  
            });
  
          }); }, 0);
  
        };
  
  
        attrs.$observe('fpBind', function(path) {
  
          path = path || '';
          if (scope.$attached) {
            scope.$detach();
            scope.$attached = false;
          }
  
          // If any of the following four conditions arise in the path:
          // 1. The path is the empty string
          // 2. two slashes appear together
          // 3. there's a trailing slash
          // 4. there's a leading slash
          // we assume there's an incomplete interpolation and don't attach
          if (path.length === 0 ||
            path.match(/\/\//) ||
            path.charAt(0) === '/' ||
            path.charAt(path.length-1) === '/') {
            return;
          }
  
          ref = firebase.root.child(path);
          scope.$attach();
  
        });
  
      }
  
    };
  
  });
  
  
  
  angular.module('angular-fireproof.directives.fpPage', [
    'angular-fireproof.directives.firebase',
    'angular-fireproof.services.status'
  ])
  .directive('fpPage', function($q, Fireproof) {
  
    return {
  
      restrict: 'A',
      scope: true,
      require: '^firebase',
      link: function(scope, el, attrs, firebase) {
  
        var ref, pager, direction;
  
        var setPage = function(snaps) {
  
          el.removeAttr('paging');
          scope.$paging = false;
  
          if (direction === 'next') {
            scope.$hasNext = snaps.length > 0;
          } else if (direction === 'previous') {
            scope.$hasPrevious = snaps.length > 0;
          } else {
            throw new Error('ASSERTION FAILED: Direction somehow wasn\'t set in setPage!');
          }
  
          scope.$keys = snaps.map(function(snap) {
            return snap.name();
          });
  
          scope.$values = snaps.map(function(snap) {
            return snap.val();
          });
  
          scope.$priorities = snaps.map(function(snap) {
            return snap.getPriority();
          });
  
          if (attrs.as) {
            scope[attrs.as] = scope.$values;
          }
  
          if (attrs.onPage) {
            scope.$evalAsync(attrs.onPage);
          }
  
        };
  
        var handleError = function(err) {
  
          el.removeAttr('paging');
          scope.$paging = false;
  
          scope.$error = err;
          if (attrs.onError) {
            scope.$evalAsync(attrs.onError);
          }
  
        };
  
        scope.$next = function() {
  
          if (pager && !scope.$paging) {
  
            el.attr('paging', '');
            scope.$paging = true;
            direction = 'next';
            return pager.next(parseInt(attrs.limit) || 5)
            .then(setPage, handleError);
  
          } else if (!scope.$paging) {
            return $q.reject(new Error('Pager does not exist. Has fp-page been set yet?'));
          }
  
        };
  
        scope.$previous = function() {
  
          if (pager && !scope.$paging) {
  
            el.attr('paging', '');
            scope.$paging = true;
            direction = 'previous';
            return pager.previous(parseInt(attrs.limit) || 5)
            .then(setPage, handleError);
  
          } else if (!scope.$paging) {
            return $q.reject(new Error('Pager does not exist. Has fp-page been set yet?'));
          }
  
        };
  
        scope.$reset = function() {
  
          scope.$hasNext = true;
          scope.$hasPrevious = false;
  
          pager = new Fireproof.Pager(new Fireproof(ref));
          return scope.$next();
  
        };
  
        attrs.$observe('fpPage', function(path) {
  
          path = path || '';
  
          // If any of the following four conditions arise in the path:
          // 1. The path is the empty string
          // 2. two slashes appear together
          // 3. there's a trailing slash
          // 4. there's a leading slash
          // we assume there's an incomplete interpolation and don't attach
          if (path.length === 0 ||
            path.match(/\/\//) ||
            path.charAt(0) === '/' ||
            path.charAt(path.length-1) === '/') {
            return;
          }
  
          ref = firebase.root.child(path);
          scope.$reset();
  
        });
  
      }
  
    };
  
  });
  
  
  
  angular.module('angular-fireproof.services.Fireproof', [])
  .factory('Firebase', function() {
    return Firebase;
  })
  .factory('ServerValue', function(Firebase) {
    return Firebase.ServerValue;
  })
  .factory('Fireproof', function($timeout, $q) {
  
    Fireproof.setNextTick($timeout);
    Fireproof.bless($q);
  
    return Fireproof;
  
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
