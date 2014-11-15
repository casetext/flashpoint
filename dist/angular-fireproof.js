
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
    'angular-fireproof.services.status',
    'angular-fireproof.directives.firebase',
    'angular-fireproof.directives.fpBind',
    'angular-fireproof.directives.fpPage',
    'angular-fireproof.services.Fireproof'
  ]);
  
  
  angular.module('angular-fireproof.controllers.FirebaseCtl', [
    'angular-fireproof.services.Fireproof',
    'angular-fireproof.services.status'
  ])
  .controller('FirebaseCtl', function(
    $q,
    Firebase,
    Fireproof,
    $scope,
    $rootScope,
    $attrs
  ) {
  
    var self = this,
      userRef,
      userListener,
      profileListeners = [];
  
    var authErrorMessage = 'auth-handler is not set for this firebase. All ' +
      'authentication requests are therefore rejected.';
  
    self.login = function(options) {
  
      if ($attrs.loginHandler) {
        return $q.when($scope.$eval($attrs.loginHandler, { $root: self.root, $options: options }));
      } else {
        return $q.reject(new Error(authErrorMessage));
      }
  
    };
  
    self.onProfile = function(cb) {
  
      profileListeners.push(cb);
  
      // always notify once immediately with whatever the current state is
      Fireproof._nextTick(function() {
        cb(self.profile);
      });
  
    };
  
    self.offProfile = function(cb) {
  
      if (profileListeners && profileListeners.length > 0) {
  
        var index = profileListeners.indexOf(cb);
        if (index !== -1) {
          profileListeners.splice(cb, 1);
        }
  
      }
  
    };
  
    function notifyProfileListeners() {
  
      profileListeners.forEach(function(cb) {
  
        Fireproof._nextTick(function() {
          cb(self.profile);
        });
  
      });
  
    }
  
    function authHandler(authData) {
  
      if (userListener) {
  
        // detach any previous user listener.
        userRef.off('value', userListener);
        userRef = null;
        userListener = null;
  
      }
  
      self.auth = authData;
  
      // get the user's profile object, if one exists
      if (self.auth && self.auth.provider !== 'anonymous' && self.auth.uid && $attrs.profilePath) {
  
        userRef = self.root.child($attrs.profilePath).child(self.auth.uid);
        userListener = userRef.on('value', function(snap) {
  
          self.profile = snap.val();
  
          notifyProfileListeners();
  
        });
  
      } else {
  
        if (self.auth && self.auth.provider === 'custom' && self.auth.uid === null) {
  
          // superuser!
          self.profile = { super: true };
  
        } else {
  
          // nobody.
          self.profile = null;
  
        }
  
        notifyProfileListeners();
  
      }
  
    }
  
  
    function attachFireproof() {
  
      if (self.root) {
  
        // detach any remaining listeners here.
        self.root.offAuth(authHandler);
        self.root.off();
  
        // clear the profile
        self.profile = null;
  
        notifyProfileListeners();
  
      }
  
      self.root = new Fireproof(new Firebase($attrs.firebase));
      self.root.onAuth(authHandler);
  
    }
  
  
    $attrs.$observe('firebase', attachFireproof);
  
    // always run attach at least once
    if ($attrs.firebase) {
      attachFireproof();
    }
  
  
    $scope.$on('$destroy', function() {
  
      // remove all onProfile listeners.
      profileListeners = null;
  
      // detach onAuth listener.
      self.root.offAuth(authHandler);
  
      // detach all remaining listeners to prevent leaks.
      self.root.off();
  
      // help out GC.
      userRef = null;
      userListener = null;
  
    });
  
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
  
  
  angular.module('angular-fireproof.directives.authClick', [
    'angular-fireproof.directives.firebase'
  ])
  .directive('authClick', function($log) {
  
    return {
      restrict: 'A',
      require: '^firebase',
      link: function(scope, el, attrs, firebase) {
  
        var authOK = false;
        firebase.onProfile(profileListener);
  
        function profileListener() {
  
          if (attrs.authCondition) {
  
            authOK = scope.$eval(attrs.authCondition, {
              $auth: firebase.$auth,
              $profile: firebase.$profile
            });
  
          } else {
  
            // by default, we check to see if the user is authed at all.
            authOK = angular.isDefined(firebase.$auth) &&
              firebase.$auth !== null &&
              firebase.$auth.provider !== 'anonymous';
  
          }
  
        }
  
        el.on('click', function() {
  
          if (authOK) {
  
            // auth check passed, perform the action
            scope.$eval(attrs.authClick, {
              $auth: firebase.$auth,
              $user: firebase.$user
            });
  
          } else {
  
            // Perform login check, then the action if it passes.
            firebase.login()
            .then(function() {
  
              // auth check passed, perform the action
              scope.$eval(attrs.authClick, {
                $auth: firebase.$auth,
                $user: firebase.$user
              });
  
            }, function(err) {
  
              // auth check FAILED, call the error handler if it exists.
              $log.debug(err);
              if (attrs.onAuthError) {
                scope.$eval(attrs.onAuthError, { $error: err });
              }
  
            });
  
          }
  
        });
  
        scope.$on('$destroy', function() {
  
          // clear the listener.
          firebase.offProfile(profileListener);
  
        });
  
      }
  
    };
  
  });
  
  
  angular.module('angular-fireproof.directives.authIf', [
    'angular-fireproof.directives.firebase'
  ])
  .directive('authIf', function($animate) {
  
    return {
  
      restrict: 'A',
      transclude: 'element',
      scope: true,
      priority: 600,
      terminal: true,
      require: '^firebase',
  
      link: function(scope, el, attrs, firebase, transclude) {
  
        var block, childScope, previousElements;
  
        firebase.onProfile(profileListener);
  
        function profileListener() {
  
          var authOK;
          if (attrs.authIf) {
  
            authOK = scope.$eval(attrs.authIf, {
              $auth: firebase.auth,
              $profile: firebase.profile
            });
  
          } else {
  
            // by default, we check to see if the user is authed at all.
            authOK = angular.isDefined(firebase.$auth) &&
              firebase.$auth !== null &&
              firebase.$auth.provider !== 'anonymous';
  
          }
  
          if (authOK) {
  
            if (!childScope) {
  
              childScope = scope.$new();
              transclude(childScope, function (clone) {
  
                clone[clone.length++] = document.createComment(' end authIf: ' + attrs.authIf + ' ');
                // Note: We only need the first/last node of the cloned nodes.
                // However, we need to keep the reference to the jqlite wrapper as it might be changed later
                // by a directive with templateUrl when its template arrives.
                block = {
                  clone: clone
                };
  
                $animate.enter(clone, el.parent(), el);
  
              });
  
            }
  
          } else {
  
            if (previousElements) {
              previousElements.remove();
              previousElements = null;
            }
            if (childScope) {
              childScope.$destroy();
              childScope = null;
            }
            if (block) {
  
              previousElements = (function getBlockNodes(nodes) {
                var node = nodes[0];
                var endNode = nodes[nodes.length - 1];
                var blockNodes = [node];
  
                do {
                  node = node.nextSibling;
                  if (!node) {
                    break;
                  }
                  blockNodes.push(node);
                } while (node !== endNode);
  
                return angular.element(blockNodes);
              })(block.clone);
  
              $animate.leave(previousElements, function() {
                previousElements = null;
              });
  
              block = null;
  
            }
  
          }
  
        }
  
        scope.$on('$destroy', function() {
          firebase.offProfile(profileListener);
        });
  
      }
  
    };
  
  });
  
  
  // by default we need this directive to be invisible. write some CSS classes
  // to head right here.
  
  (function() {
  
    var css = '[auth-show]:not(.show) { display:none; }';
  
    try {
  
      var head = document.getElementsByTagName('head')[0];
      var s = document.createElement('style');
      s.setAttribute('type', 'text/css');
      if (s.styleSheet) { // IE
        s.styleSheet.cssText = css;
      } else { // others
        s.appendChild(document.createTextNode(css));
      }
  
      head.appendChild(s);
  
    } catch(e) {}
  
  })();
  
  angular.module('angular-fireproof.directives.authShow', [
    'angular-fireproof.directives.firebase'
  ])
  .directive('authShow', function() {
  
    return {
  
      restrict: 'A',
      require: '^firebase',
      link: function(scope, el, attrs, firebase) {
  
        firebase.onProfile(profileListener);
  
        function profileListener() {
  
          var authOK;
          if (attrs.authShow) {
  
            authOK = scope.$eval(attrs.authShow, {
              $auth: firebase.auth,
              $profile: firebase.profile
            });
  
          } else {
  
            // by default, we check to see if the user is authed at all.
            authOK = angular.isDefined(firebase.$auth) &&
              firebase.auth !== null &&
              firebase.auth.provider !== 'anonymous';
  
          }
  
          if (authOK) {
            el.addClass('show');
          } else {
            el.removeClass('show');
          }
  
        }
  
        scope.$on('$destroy', function() {
          firebase.offProfile(profileListener);
        });
  
      }
  
    };
  
  });
  
  
  angular.module('angular-fireproof.directives.firebase', [
    'angular-fireproof.controllers.FirebaseCtl',
    'angular-fireproof.services.Fireproof'
  ])
  .directive('firebase', function() {
  
    return {
  
      restrict: 'A',
      scope: true,
      controller: 'FirebaseCtl'
  
    };
  
  });
  
  
  
  angular.module('angular-fireproof.directives.fpBind', [
    'angular-fireproof.directives.firebase',
    'angular-fireproof.services.status'
  ])
  .directive('fpBind', function($q, _fireproofStatus) {
  
    return {
  
      restrict: 'A',
      scope: true,
      require: '^firebase',
      link: function(scope, el, attrs, firebase) {
  
        var fpWatcher, scopeWatchCancel, currentSnap, firstLoad;
  
        function loadOK(snap) {
  
          if (scopeWatchCancel) {
            scopeWatchCancel();
          }
  
          currentSnap = snap;
  
          if (!firstLoad) {
            firstLoad = true;
            _fireproofStatus.finish(firebase.root.child(attrs.fpBind).toString());
          }
  
          delete scope.$fireproofError;
          scope[attrs.as] = currentSnap.val();
  
          if (attrs.sync) {
  
            scopeWatchCancel = scope.$watch(attrs.as, function(newVal) {
  
              if (newVal !== undefined && !angular.equals(newVal, currentSnap.val())) {
                scope.$sync(newVal);
              }
  
            });
  
          }
  
          if (attrs.onLoad) {
             scope.$eval(attrs.onLoad, { '$snap': snap });
          }
  
          scope.$syncing = false;
  
        }
  
  
        function loadError(err) {
  
          currentSnap = null;
  
          if (!firstLoad) {
            firstLoad = true;
            _fireproofStatus.finish(firebase.root.child(attrs.fpBind).toString());
          }
  
          scope.$fireproofError = err;
          scope.syncing = false;
  
          var code = err.code.toLowerCase().replace(/[^a-z]/g, '-');
          var lookup = attrs.$attr['on-' + code];
  
          if (attrs[lookup]) {
            scope.$eval(attrs[lookup], { '$error': err });
          } else if (attrs.onError) {
            scope.$eval(attrs.onError, { '$error': err });
          }
  
  
        }
  
  
        scope.$reload = function() {
  
          if (!scope.$syncing) {
  
            firstLoad = false;
  
            delete scope.$fireproofError;
            scope.$syncing = true;
  
            if (fpWatcher) {
              firebase.root.child(attrs.fpBind).off('value', fpWatcher);
            }
  
            if (scopeWatchCancel) {
              scopeWatchCancel();
            }
  
            _fireproofStatus.start(firebase.root.child(attrs.fpBind).toString());
  
            if (attrs.watch) {
              fpWatcher = firebase.root.child(attrs.fpBind)
              .on('value', loadOK, loadError);
            } else {
              firebase.root.child(attrs.fpBind)
              .once('value', loadOK, loadError);
            }
  
          }
  
        };
  
  
        // this function is a no-op if sync is set.
        scope.$revert = function() {
  
          if (!attrs.sync && currentSnap) {
            scope[attrs.as] = currentSnap.val();
          }
  
        };
  
  
        scope.$sync = function() {
  
          if (!scope.$syncing) {
  
            scope.$syncing = true;
            delete scope.$fireproofError;
  
            // if there's another location we're supposed to save to,
            // save there also
            var savePromises = [];
  
            savePromises.push(firebase.root.child(attrs.fpBind)
            .set(scope[attrs.as]));
  
            if (attrs.linkTo) {
  
              savePromises.push(
                firebase.root.child(attrs.linkTo)
                .set(scope[attrs.as]));
  
            }
  
            return $q.all(savePromises)
            .then(function() {
  
              if (attrs.onSave) {
                scope.$eval(attrs.onSave);
              }
  
            })
            .catch(function(err) {
  
              scope.$fireproofError = err;
  
              var code = err.code.toLowerCase().replace(/[^a-z]/g, '-');
              var lookup = attrs.$attr['on-' + code];
  
              if (attrs[lookup]) {
                scope.$eval(attrs[lookup], { '$error': err });
              } else if (attrs.onError) {
                scope.$eval(attrs.onError, { '$error': err });
              }
  
            })
            .finally(function() {
              scope.$syncing = false;
            });
  
          }
  
        };
  
  
        attrs.$observe('fpBind', function(path) {
  
          delete scope.$fireproofError;
  
          if (path[path.length-1] === '/') {
            // this is an incomplete eval. we're done.
            return;
          } else if (!attrs.as) {
            throw new Error('Missing "as" attribute on fp-bind="' + attrs.fpBind + '"');
          }
  
          // shut down everything.
  
          if (scopeWatchCancel) {
            scopeWatchCancel();
          }
  
          scope.$reload();
  
        });
  
        scope.$on('$destroy', function() {
  
          // if this scope object is destroyed, finalize the controller and
          // cancel the Firebase watcher if one exists
  
          if (fpWatcher) {
            firebase.root.child(attrs.fpBind).off('value', fpWatcher);
          }
  
          if (scopeWatchCancel) {
            scopeWatchCancel();
          }
  
          // finalize as a favor to GC
          fpWatcher = null;
          scopeWatchCancel = null;
          currentSnap = null;
  
        });
  
  
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
    'angular-fireproof.directives.firebase',
    'angular-fireproof.services.status'
  ])
  .directive('fpPage', function($q) {
  
    return {
  
      restrict: 'A',
      scope: true,
      require: '^firebase',
      link: function(scope, el, attrs, fireproof) {
  
        var ref, pager, paging;
  
        function handleSnaps(snaps) {
  
          paging = false;
  
          if (snaps.length > 0) {
  
            scope[attrs.as] = snaps.map(function(snap) {
              return snap.val();
            });
  
            scope[attrs.as].$keys = snaps.map(function(snap) {
              return snap.name();
            });
  
            scope[attrs.as].$priorities = snaps.map(function(snap) {
              return snap.getPriority();
            });
  
            scope[attrs.as].$next = function() {
              scope.$next();
            };
  
            scope[attrs.as].$previous = function() {
              scope.$previous();
            };
  
            scope[attrs.as].$reset = function() {
              scope.$reset();
            };
  
            if (attrs.onPage) {
              scope.$eval(attrs.onPage, { '$snaps': snaps });
            }
  
          }
  
          return snaps;
  
        }
  
  
        function handleError(err) {
  
          paging = false;
  
          var code = err.code.toLowerCase().replace(/[^a-z]/g, '-');
          var lookup = attrs.$attr['on-' + code];
  
          if (attrs[lookup]) {
            scope.$eval(attrs[lookup], { '$error': err });
          } else if (attrs.onError) {
            scope.$eval(attrs.onError, { '$error': err });
          }
  
        }
  
  
        scope.$next = function() {
  
          if (scope.$hasNext && !paging) {
  
            paging = true;
  
            var limit;
            if (attrs.limit) {
              limit = parseInt(scope.$eval(attrs.limit));
            } else {
              limit = 5;
            }
  
            return pager.next(limit)
            .then(handleSnaps, handleError)
            .then(function(snaps) {
  
              scope.$hasPrevious = true;
              scope.$hasNext = snaps.length > 0;
  
              return snaps;
  
            });
  
          } else if (paging) {
            return $q.reject(new Error('cannot call $next from here, no more objects'));
          } else {
            return $q.reject(new Error('cannot call $next from here, no more objects'));
          }
  
        };
  
  
        scope.$previous = function() {
  
          // set position to the first item in the current list
          if (scope.$hasPrevious && !paging) {
  
            paging = true;
  
            var limit;
            if (attrs.limit) {
              limit = parseInt(scope.$eval(attrs.limit));
            } else {
              limit = 5;
            }
  
            return pager.previous(limit)
            .then(handleSnaps, handleError)
            .then(function(snaps) {
  
              scope.$hasNext = true;
              scope.$hasPrevious = snaps.length > 0;
              return snaps;
  
            });
  
          } else {
            return $q.reject(new Error('cannot call $next from here, no more objects'));
          }
  
  
        };
  
  
        scope.$reset = function() {
  
          scope.$hasNext = true;
          scope.$hasPrevious = true;
  
  
          // create the pager.
          var limit;
          if (attrs.limit) {
            limit = parseInt(scope.$eval(attrs.limit));
          } else {
            limit = 5;
          }
          pager = new Fireproof.Pager(ref, limit);
  
          if (attrs.startAtPriority && attrs.startAtName) {
  
            pager.setPosition(
              scope.$eval(attrs.startAtPriority),
              scope.$eval(attrs.startAtName));
  
          } else if (attrs.startAtPriority) {
            pager.setPosition(scope.$eval(attrs.startAtPriority));
          }
  
          // pull the first round of results out of the pager.
          paging = true;
          return pager.then(handleSnaps, handleError)
          .then(function(snaps) {
  
            scope.$hasPrevious = false;
            scope.$hasNext = true;
  
            return snaps;
  
          });
  
        };
  
  
        attrs.$observe('fpPage', function(path) {
  
          if (path[path.length-1] === '/') {
            // this is an incomplete eval. we're done.
            return;
          } else if (!attrs.as) {
            throw new Error('Missing "as" attribute on fp-page="' + attrs.fpPage + '"');
          }
  
          ref = fireproof.root.child(path);
  
          // shut down everything.
          scope.$reset();
  
        });
  
  
        scope.$on('$destroy', function() {
  
          // if this scope object is destroyed, finalize the controller
          ref = null;
          pager = null;
  
        });
  
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
  
  

}));
