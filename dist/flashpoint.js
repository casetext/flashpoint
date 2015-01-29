/*! flashpoint 2.1.0, © 2015 J2H2 Inc. MIT License.
 * https://github.com/casetext/flashpoint
 */
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
    
  /**
   * @ngdoc module
   * @name flashpoint
   */
  angular.module('flashpoint', []);
  
  
  angular.module('flashpoint')
  .directive('firebase', function() {
  
    /**
     * @ngdoc directive
     * @name firebase
     * @description Wires Firebase into an Angular application.
     *
     * The `firebase` directive is an easy way to make the Firebase controller available
     * to enclosing scope, where it is exposed as `fp`.
     *
     * @example
     * `fp.val` and all succeeding methods take a variable number of path components followed by their
     * necessary arguments (for `fp.set` and `fp.update`, a value; for `fp.setPriority`, a priority; and for
     * `fp.setWithPriority`, a value and a priority). So you could do the following:
     * `Your assigned seat is {{ fp.val('seatAssignments', fp.auth.uid) }}`.
     *
     * `fp.set` and related methods all return a closure {@type function} so that you can
     * easily pass them into a promise chain like so:
     *
     * <example firebase="https://my-firebase.firebaseio.com">
     *   <button ng-disabled='fp.auth === null' ng-click="fp.set('signups', $auth.uid, true)">Sign up!</button>
     * </example>
     *
     *
     * @restrict A
     * @element ANY
     * @scope
     * @param {expression} firebase Full URL to the Firebase, like
     * `https://my-firebase.firebaseio.com`. Interpolatable.
     * @param {expression} challenge Expression to evaluate when fp.challenge() is called
     * somewhere. This expression should evaluate to a promise that resolves on
     */
  
    var attached, attachedUrl;
  
  
    function firebasePreLink(scope, el, attrs, fp) {
  
      var attachToController = function(url) {
  
        if (attached && url === attachedUrl) {
          // already attached to this path, no action necessary
          return;
        }
  
        fp.attachFirebase(url);
        attached = true;
        attachedUrl = url;
  
      };
  
  
      if (attrs.firebase) {
        attachToController(attrs.firebase);
      }
      scope.fp = fp;
  
      attrs.$observe('firebase', attachToController);
  
    }
  
  
    return {
  
      restrict: 'A',
      scope: true,
      controller: 'FirebaseCtl',
      priority: 1000,
      link: {
        pre: firebasePreLink
      }
  
    };
  
  });
  
  
  
  angular.module('flashpoint')
  .directive('fpPage', ["$q", "$animate", "Fireproof", function($q, $animate, Fireproof) {
  
    /**
     * @ngdoc directive
     * @name fpPage
     * @description Pages over the keys at a Firebase location.
     *
     * fpPage exposes the following methods and variables on local scope:
     *
     * | Variable       | Type                 | Details                                                    |
     * |----------------|----------------------|------------------------------------------------------------|
     * | `$next`        | {@type function}     | Fetches the next set of values into scope.                 |
     * | `$previous`    | {@type function}     | Fetches the previous set of values into scope.             |
     * | `$reset`       | {@type function}     | Starts again at the beginning.                             |
     * | `$keys`        | {@type Array.string} | The keys in the current page.                              |
     * | `$values`      | {@type Array.*}      | The values in the current page.                            |
     * | `$priorities`  | {@type Array.*}      | The priorities in the current page.                        |
     * | `$hasNext`     | {@type boolean}      | True if there are more values to page over.                |
     * | `$hasPrevious` | {@type boolean}      | True if there are previous values to page back over again. |
     * | `$paging`      | {@type boolean}      | True if a paging operation is currently in progress.       |
     * | `$pageNumber`  | {@type number}       | The current page number of results.                        |
     * | `$error`       | {@type Error}        | The most recent error returned from Firebase or undefined. |
     *
     *
     * @restrict A
     * @element ANY
     * @scope
     * @param {expression} fpPage Path to the location in the Firebase, like
     * `favorites/{{ $auth.uid }}`. Interpolatable.
     * @param {expression} as The name of a variable on scope to bind. So you could do
     * something like
     * `<example fp-page="users" as="users">
     *   <ul>
     *     <li ng-repeat="user in users"> {{ user.name }} </li>
     *   </ul>
     * </example>`
     * @param {expression} onPage An expression that gets evaluated when a new page
     * is available.
     * @param {expression} onError An expression that gets evaluated when Firebase
     * returns an error.
     * @param {expression} limit The count of objects in each page.
     */
  
    return {
  
      restrict: 'A',
      scope: true,
      require: '^firebase',
      link: function(scope, el, attrs, fp) {
  
        var ref, pager;
  
        var setPage = function(snaps) {
  
          $animate.removeClass(el, 'fp-paging');
          scope.$paging = false;
  
          scope.$hasPrevious = pager.hasPrevious && scope.$pageNumber !== 1;
          scope.$hasNext = pager.hasNext;
  
          scope.$keys = snaps.map(function(snap) {
            return snap.key();
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
  
          $animate.removeClass(el, 'fp-paging');
          scope.$paging = false;
  
          $animate.addClass(el, 'fp-error');
          scope.$error = err;
          if (attrs.onError) {
            scope.$evalAsync(attrs.onError);
          }
  
        };
  
        scope.$next = function() {
  
          if (pager && !scope.$paging && scope.$hasNext) {
  
            var count;
            if (parseInt(attrs.limit)) {
              count = parseInt(attrs.limit);
            } else {
              count = 5;
            }
  
            var nextCount;
            if (pager._direction === 'previous') {
              // have to go back over some stuff
              nextCount = (count + scope.$values.length) - 1;
            } else {
              // straight back
              nextCount = count;
            }
  
            $animate.addClass(el, 'fp-paging');
            scope.$paging = true;
            return pager.next(nextCount)
            .then(function(results) {
  
              scope.$pageNumber++;
  
              if (nextCount !== count) {
                results = results.slice(count-1);
              }
  
              return results;
  
            })
            .then(setPage, handleError);
  
          } else if (!angular.isDefined(pager)) {
            return $q.reject(new Error('Pager does not exist. Has fp-page been set yet?'));
          } else {
            return $q.when();
          }
  
        };
  
        scope.$previous = function() {
  
          if (pager && !scope.$paging && scope.$hasPrevious) {
  
            var count;
            if (parseInt(attrs.limit)) {
              count = parseInt(attrs.limit);
            } else {
              count = 5;
            }
  
            var prevCount;
            if (pager._direction === 'next') {
              // have to go back over some stuff
              prevCount = (count + scope.$values.length) - 1;
            } else {
              // straight back
              prevCount = count;
            }
  
            $animate.addClass(el, 'fp-paging');
            scope.$paging = true;
            return pager.previous(prevCount)
            .then(function(results) {
  
              scope.$pageNumber--;
              results = results.slice(0, count);
              return results;
  
            })
            .then(setPage, handleError);
  
          } else if (!angular.isDefined(pager)) {
            return $q.reject(new Error('Pager does not exist. Has fp-page been set yet?'));
          } else {
            return $q.when();
          }
  
        };
  
        scope.$reset = function() {
  
          $animate.removeClass(el, 'fp-paging');
          $animate.removeClass(el, 'fp-error');
  
          delete scope.$error;
          scope.$pageNumber = 0;
          scope.$hasNext = true;
          scope.$hasPrevious = false;
          scope.$paging = false;
  
          pager = new Fireproof.Pager(new Fireproof(ref));
          pager._direction = 'next';
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
  
          ref = fp.root.child(path);
          scope.$reset();
  
        });
  
      }
  
    };
  
  }]);
  
  
  
  angular.module('flashpoint')
  .factory('ChildQuery', ["validatePath", function(validatePath) {
  
    /**
     * @ngdoc type
     * @name ChildQuery
     * @description A way to generate long Firebase queries inside an Angular expression.
     */
    function ChildQuery(listenerSet) {
  
      this.listenerSet = listenerSet;
      this._props = {};
  
    }
  
    /**
     * @ngdoc method
     * @name ChildQuery#startAt
     * @description Invokes Fireproof#startAt.
     */
    ChildQuery.prototype.startAt = function(value, key) {
  
      this._props.startAtValue = value;
      if (key) {
        this._props.startAtKey = key;
      }
  
      return this;
  
    };
  
    /**
     * @ngdoc method
     * @name ChildQuery#endAt
     * @description Invokes Fireproof#endAt.
     */
    ChildQuery.prototype.endAt = function(value, key) {
  
      this._props.endAtValue = value;
      if (key) {
        this._props.endAtKey = key;
      }
  
      return this;
  
    };
  
    /**
     * @ngdoc method
     * @name ChildQuery#equalTo
     * @description Invokes Fireproof#equalTo.
     */
    ChildQuery.prototype.equalTo = function(value, key) {
  
      this._props.equalToValue = value;
      if (key) {
        this._props.equalToKey = key;
      }
  
      return this;
  
    };
  
    /**
     * @ngdoc method
     * @name ChildQuery#limitToFirst
     * @description Invokes Fireproof#limitToFirst.
     */
    ChildQuery.prototype.limitToFirst = function(limit) {
  
      this._props.limitToFirst = limit;
      return this;
  
    };
  
    /**
     * @ngdoc method
     * @name ChildQuery#limitToLast
     * @description Invokes Fireproof#limitToLast.
     */
    ChildQuery.prototype.limitToLast = function(limit) {
  
      this._props.limitToLast = limit;
      return this;
  
    };
  
    /**
     * @ngdoc method
     * @name ChildQuery#orderByKey
     * @description Invokes Fireproof#orderByKey.
     */
    ChildQuery.prototype.orderByKey = function() {
  
      this._props.orderBy = 'key';
      return this;
  
    };
  
    /**
     * @ngdoc method
     * @name ChildQuery#orderByPriority
     * @description Invokes Fireproof#orderByPriority.
     */
    ChildQuery.prototype.orderByPriority = function() {
  
      this._props.orderBy = 'priority';
      return this;
  
    };
  
    /**
     * @ngdoc method
     * @name ChildQuery#orderByChild
     * @description Invokes Fireproof#orderByChild.
     */
    ChildQuery.prototype.orderByChild = function(child) {
  
      this._props.orderBy = 'child';
      this._props.orderByChild = child;
      return this;
  
    };
  
    /**
     * @ngdoc method
     * @name ChildQuery#of
     * @description Specifies the path for the child query. NOTE: ALWAYS DO THIS LAST!
     * @param {...String} pathParams The path parameters for this query.
     */
    ChildQuery.prototype.of = function() {
  
      var args = Array.prototype.slice.call(arguments, 0),
        path = validatePath(args),
        ref = this.listenerSet.root.child(path),
        id = path + '.children';
  
      switch(this._props.orderBy || '') {
      case 'key':
        id += '.orderByKey';
        ref = ref.orderByKey();
        break;
      case 'priority':
        id += '.orderByPriority';
        ref = ref.orderByPriority();
        break;
      case 'child':
        id += '.orderByChild.' + this._props.orderByChild;
        ref = ref.orderByChild(this._props.orderByChild);
        break;
      }
  
      if (this._props.startAtValue && this._props.startAtKey) {
        id += '.startAtValue.' + this._props.startAtValue + '.startAtKey.' + this._props.startAtKey;
        ref = ref.startAt(this._props.startAtValue, this._props.startAtKey);
      } else if (this._props.startAtValue) {
        id += '.startAtValue.' + this._props.startAtValue;
        ref = ref.startAt(this._props.startAtValue);
      }
  
      if (this._props.endAtValue && this._props.endAtKey) {
        id += '.endAtValue.' + this._props.endAtValue + '.endAtKey.' + this._props.endAtKey;
        ref = ref.endAt(this._props.endAtValue, this._props.endAtKey);
      } else if (this._props.endAtValue) {
        id += '.endAtValue.' + this._props.endAtValue;
        ref = ref.endAt(this._props.endAtValue);
      }
  
      if (this._props.equalToValue && this._props.equalToKey) {
        id += '.equalToValue.' + this._props.equalToValue + '.equalToKey.' + this._props.equalToKey;
        ref = ref.equalTo(this._props.equalToValue, this._props.equalToKey);
      } else if (this._props.equalToValue) {
        id += '.equalToValue.' + this._props.equalToValue;
        ref = ref.equalTo(this._props.equalToValue);
      }
  
      if (this._props.limitToFirst) {
        id += '.limitToFirst.' + this._props.limitToFirst;
        ref = ref.limitToFirst(this._props.limitToFirst);
      }
  
      if (this._props.limitToLast) {
        id += '.limitToLast.' + this._props.limitToLast;
        ref = ref.limitToLast(this._props.limitToLast);
      }
  
      if (this.listenerSet.has(id)) {
        return this.listenerSet.watchers[id];
      } else {
  
        var watcher = new Fireproof.LiveArray();
        this.listenerSet.add(id, watcher);
  
        if (this._props.orderBy === 'child') {
          watcher.connect(ref, this._props.orderBy, this._props.orderByChild);
        } else if (this._props.orderBy) {
          watcher.connect(ref, this._props.orderBy);
        } else {
          watcher.connect(ref);
        }
  
        return watcher;
  
      }
  
    };
  
    return ChildQuery;
  
  }]);
  
  
  angular.module('flashpoint')
  .factory('Firebase', function() {
  
  /**
   * @ngdoc service
   * @name Firebase
   * @description The Firebase class.
   *
   * The Firebase library exposes this on window by default, but using Angular DI
   * allows it to be mocked or modified if you wish.
   *
   * NB: You should not use this service yourself! Instead, use the firebase
   * directive and write your own directives to require it, then access its
   * `root` Firebase reference.
   *
   * @see {@link FirebaseCtl#cleanup}
   */
  
    return Firebase;
  
  })
  .factory('ServerValue', ["Firebase", function(Firebase) {
  
    /**
     * @ngdoc service
     * @name ServerValue
     * @description The object ordinarily discovered on `Firebase.ServerValue`.
     *
     * Available for convenience.
     * @see {@link Firebase}
     */
  
    return Firebase.ServerValue;
  
  }])
  .factory('Fireproof', ["$rootScope", "$q", function($rootScope, $q) {
  
    /**
     * @ngdoc service
     * @name Fireproof
     * @description The Fireproof class, properly configured for use in Angular.
     *
     * "Properly configured" means that $rootScope.$evalAsync is used for nextTick and
     * Angular's $q is used for promises).
     *
     * NB: You should not use this service yourself! Instead, use the firebase
     * directive and write your own directives to require it, then access its
     * `root` Firebase reference.
     */
  
    Fireproof.setNextTick(function(fn) {
      $rootScope.$evalAsync(fn);
    });
    Fireproof.bless($q);
  
    return Fireproof;
  
  }]);
  
  
  angular.module('flashpoint')
  .factory('ListenerSet', function() {
  
    function ListenerSet(root, scope) {
  
      var self = this,
        scrubbingListeners = false;
  
      self.watchers = {};
      self.liveWatchers = {};
      self.values = {};
      self.priorities = {};
      self.errors = {};
  
      self.scope = scope;
      self.scope.$watch(function() {
  
        // after each scope cycle, sweep out any "orphaned" listeners, i.e.,
        // ones we previously connected but don't need anymore.
  
        if (!scrubbingListeners) {
  
          scrubbingListeners = true;
          scope.$$postDigest(function() {
  
            for (var path in self.watchers) {
  
              if (self.watchers[path] && !self.liveWatchers[path]) {
                self.remove(path);
              }
  
            }
  
          });
  
        }
  
      });
  
    }
  
    ListenerSet.prototype.add = function(path, watcher) {
  
      var self = this;
  
      self.liveWatchers[path] = true;
  
      if (!self.watchers[path]) {
  
        if (watcher) {
          self.watchers[path] = watcher;
        } else {
  
          self.watchers[path] = self.root.child(path)
          .on('value', function(snap) {
  
            self.errors[path] = null;
            self.values[path] = snap.val();
            self.priorities[path] = snap.getPriority();
            self.scope.$evalAsync();
  
          }, function(err) {
  
            self.liveWatchers[path] = false;
            self.watchers[path] = null;
            self.errors[path] = err;
            self.values[path] = null;
            self.priorities[path] = null;
            self.scope.$evalAsync();
  
          });
  
        }
  
      }
  
    };
  
  
    ListenerSet.prototype.has = function(path) {
      return this.watchers.hasOwnProperty(path);
    };
  
  
    ListenerSet.prototype.remove = function(path) {
  
      // disconnect this watcher, it doesn't exist anymore.
      if (this.watchers[path].disconnect) {
        this.watchers[path].disconnect();
      } else {
        this.root.child(path).off('value', this.watchers[path]);
      }
  
      // clear all values associated with the watcher
      this.values[path] = null;
      this.errors[path] = null;
      this.priorities[path] = null;
      this.watchers[path] = null;
  
    };
  
  
    ListenerSet.prototype.clear = function() {
  
      for (var path in this.watchers) {
        this.remove(path);
      }
  
    };
  
    return ListenerSet;
  
  });
  
  
  angular.module('flashpoint')
  .factory('validatePath', function() {
  
    function validatePath(pathParts) {
  
      // check the arguments
      var path = pathParts.join('/');
  
      if (pathParts.length === 0 || path === '' ||
        pathParts.indexOf(null) !== -1 || pathParts.indexOf(undefined) !== -1) {
  
        // if any one of them is null/undefined, this is not a valid path
        return null;
  
      } else {
        return path;
      }
  
    }
  
    return validatePath;
  
  });
  
  
  function FirebaseCtl(
    $log,
    $q,
    $scope,
    $injector,
    $timeout,
    Firebase,
    Fireproof,
    ChildQuery,
    validatePath,
    ListenerSet) {
  
    /**
     * @ngdoc type
     * @name FirebaseCtl
     * @module flashpoint
     * @description The core controller responsible for binding
     * Firebase data into Angular.
     *
     * Firebase instantiates a root Firebase object based on
     * the value of the `firebase` property and attaches a core authentication
     * handler.
     * @property {Firebase} root The root of the instantiated Firebase store.
     * @property {object} $auth Firebase authentication data, or `null`.
     */
  
    var self = this;
  
    self.auth = null;
  
    function authHandler(authData) {
  
      self.listenerSet.clear();
      self.auth = authData;
  
      $scope.$evalAsync();
  
    }
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#cleanup
     * @description Removes and detaches all connections to Firebase used by
     * this controller.
     */
    self.cleanup = function() {
  
      // detach all watchers
      self.listenerSet.clear();
  
      // detach any remaining listeners here.
      self.root.offAuth(authHandler);
  
      // detach all listeners to prevent leaks.
      self.root.off();
  
      // remove the actual root object itself, as it's now invalid.
      delete self.root;
  
      // clear auth data.
      delete self.auth;
  
      $scope.$evalAsync();
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#attachFirebase
     * @description Connects to the specified Firebase.
     * @param {string} url The full URL of the Firebase to connect to.
     */
    self.attachFirebase = function(url) {
  
      // if we already have a root, make sure to clean it up first
      if (self.root) {
        self.cleanup();
      }
  
      self.root = new Fireproof(new Firebase(url));
  
      self.listenerSet = new ListenerSet(self.root, $scope);
      self.auth = self.root.getAuth();
      self.root.onAuth(authHandler);
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#set
     * @description Set a Firebase path to a given value.
     * @param {...string} pathPart Path components to be joined.
     * @param {(Object|String|Number|Boolean|Array|null)} value The value to set the path to.
     * @returns {Promise}
     * @see Fireproof#set
     *
     * @example
     * ```js
     * fp.set('users', 'fritz', { hometown: 'Metropolis'})
     * ```
     *
     * ```html
     * <button ng-click="fp.set('users', user, 'activated', true)">Activate!</button>
     * ```
     */
    self.set = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        value = args.pop(),
        path = validatePath(args);
  
      return self.root.child(path).set(value);
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#setPriority
     * @description Set a Firebase path to a given priority.
     * @param {...string} pathPart Path components to be joined.
     * @param {(String|Number|null)} priority The priority to set the path to.
     * @returns {Promise}
     * @see Fireproof#setPriority
     *
     * @example
     * ```js
     * fp.setPriority('users', 'fritz', Date)
     * ```
     *
     * ```html
     * <button ng-click="fp.setPriority('users', user, 0)">To teh top!</button>
     * ```
     * @see Firebase#setPriority
     */
    self.setPriority = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        priority = args.pop(),
        path = validatePath(args);
  
      return self.root.child(path).setPriority(priority);
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#setWithPriority
     * @description Set a Firebase path to a given value and priority.
     * @param {...string} pathPart Path components to be joined.
     * @param {(Object|String|Number|Boolean|Array|null)} value The value to set the path to.
     * @param {(String|Number|null)} priority The priority to set the path to.
     * @returns {Promise}
     * @see Fireproof#setWithPriority
     *
     * @example
     * ```js
     * fp.setWithPriority('users', 'fritz', { hometown: 'Metropolis' }, Date)
     * ```
     *
     * ```html
     * <button ng-click="fp.setWithPriority('status', event, 'pending', 0)">Reset to pending</button>
     * ```
     * @see Firebase#setWithPriority
     */
    self.setWithPriority = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        priority = args.pop(),
        value = args.pop(),
        path = validatePath(args);
  
        return self.root.child(path).setWithPriority(value, priority);
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#push
     * @description Add a child to a Firebase path.
     * @param {...string} pathPart Path components to be joined.
     * @param {(Object|String|Number|Boolean|Array|null)} value The value to append to the path.
     * @param {(String|Number|null)} priority The priority to set the path to.
     * @returns {Promise}
     * @see Fireproof#push
     *
     * @example
     * ```js
     * fp.push('users', { name: 'Fritz', hometown: 'Metropolis' })
     * ```
     *
     * ```html
     * <button ng-click="fp.push('comments', commentText)">Add your comment!</button>
     * ```
     * @see Firebase#push
     */
    self.push = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        value = args.pop(),
        path = validatePath(args);
  
      return self.root.child(path).push(value);
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#update
     * @description Update a Firebase path with a given object.
     * @param {...string} pathPart Path components to be joined.
     * @param {(Object|String|Number|Boolean|Array|null)} value The value to update the path with.
     * @returns {Promise}
     * @see Fireproof#update
     *
     * @example
     * ```js
     * fp.update('users', 'fritz', { hometown: 'Metropolis' })
     * ```
     *
     * ```html
     * <button ng-click="fp.update('users', user, { disabled: true } )">Disable user</button>
     * ```
     * @see Firebase#update
     */
    self.update = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        value = args.pop(),
        path = validatePath(args);
  
      return self.root.child(path).update(value);
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#remove
     * @description Remove a Firebase path.
     * @param {...string} pathPart Path components to be joined.
     * @returns {Promise}
     * @see Fireproof#remove
     *
     * @example
     * ```js
     * fp.remove('users', 'fritz')
     * ```
     *
     * ```html
     * <button ng-click="fp.remove('users', user)">Remove user</button>
     * ```
     * @see Firebase#update
     */
    self.remove = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        path = validatePath(args);
  
      return self.root.child(path).remove();
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#increment
     * @description Atomically increments a numeric value in Firebase.
     * @param {...string} pathPart Path components to be joined.
     * @returns {Promise}
     *
     * @example
     * ```js
     * fp.increment('users/fritz/votes')
     * ```
     *
     * ```html
     * <button ng-click="fp.increment('users', user, 'votes')">Vote for this user!</button>
     * ```
     */
    self.increment = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        path = validatePath(args);
  
  
      return self.root.child(path)
      .transaction(function(val) {
  
        if (angular.isNumber(val)) {
          return val + 1;
        } else if (val === null) {
          return 1;
        } else {
          return; // abort transaction
        }
  
      })
      .then(function(result) {
  
        if (!result.committed) {
          return $q.reject(new Error('Cannot increment the object at ' + path));
        }
  
      });
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#decrement
     * @description Atomically decrements a numeric value in Firebase.
     * @param {...string} pathPart Path components to be joined.
     * @returns {Promise}
     *
     * @example
     * ```js
     * fp.decrement('users', 'fritz', 'votes')
     * ```
     *
     * ```html
     * <button ng-click="fp.decrement('users', user, 'votes')">Vote against this user!</button>
     * ```
     */
    self.decrement = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        path = validatePath(args);
  
      return self.root.child(path)
      .transaction(function(val) {
  
        if (angular.isNumber(val)) {
          return val - 1;
        } else if (val === null) {
          return 0;
        } else {
          return; // abort transaction
        }
  
      })
      .then(function(result) {
  
        if (!result.committed) {
          return $q.reject(new Error('Cannot decrement the object at ' + path));
        }
  
      });
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#transaction
     * @description Performs a transaction in Firebase.
     * @param {...string} pathPart Path components to be joined.
     * @param {Function} fn The function that describes the transaction. Takes one
     * argument, the existing value in Firebase. See the Firebase docs on transactions.
     * @returns {Promise}
     * @see Fireproof#transaction
     *
     * @example
     * ```js
     * fp.decrement('users', 'fritz', 'votes')
     * ```
     *
     * ```html
     * <button ng-click="fp.decrement('users', user, 'votes')">Vote against this user!</button>
     * ```
     * @see Firebase#transaction
     */
    self.transaction = function() {
  
      // check the arguments
      var args = Array.prototype.slice.call(arguments, 0),
        fn = args.pop(),
        path = validatePath(args);
  
      return self.root.child(path)
      .transaction(function(val) {
        return fn(val);
      })
      .then(function(result) {
  
        if (!result.committed) {
          return $q.reject(new Error('Aborted'));
        }
  
      });
  
    };
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#val
     * @description Gets a value from Firebase and triggers scope refresh when that value changes.
     * @param {...string} pathPart Path components to be joined.
     * @returns {*} `null` on the first scope digest, and the actual value subsequently.
     *
     * @example
     * ```html
     * <span>Welcome, {{ fp.val('users', userId, 'firstName') }}!</button>
     * ```
     */
    self.val = function() {
  
      var path = validatePath(Array.prototype.slice.call(arguments, 0));
      if (!path) {
        return;
      }
  
      self.listenerSet.add(path);
  
      if (self.listenerSet.values.hasOwnProperty(path)) {
        return self.listenerSet.values[path];
      } else {
        return null;
      }
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#priority
     * @description Gets a priority from Firebase and triggers scope refresh when that priority changes.
     * @param {...string} pathPart Path components to be joined.
     * @returns {*} `null` on the first scope digest, and the actual priority subsequently.
     */
    self.priority = function() {
  
      var path = validatePath(Array.prototype.slice.call(arguments, 0));
      if (!path) {
        return;
      }
  
      self.listenerSet.add(path);
  
      if (self.listenerSet.priorities.hasOwnProperty(path)) {
        return self.listenerSet.priorities[path];
      } else {
        return null;
      }
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#error
     * @description Gets the error associated with trying to read a specific path in Firebase.
     * @param {...string} pathPart Path components to be joined.
     * @returns {*} The error on trying to read the path, or `null` if there wasn't one.
     *
     * @example
     * ```html
     * <span>Welcome, {{ fp.val('users', userId, 'firstName') }}!</button>
     * ```
     */
    self.error = function() {
  
      var path = validatePath(Array.prototype.slice.call(arguments, 0));
      if (path) {
        return self.listenerSet.errors[path];
      } else {
        return null;
      }
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#children
     * @description Provides a live array of the children at a path in Firebase.
     * @param {...string} pathPart Path components to be joined.
     * @returns {Fireproof.LiveArray} A live array, which is an object with three keys:
     * 'keys', 'priorities', and 'values'.
     * The array references are guaranteed to remain stable, so you can bind to them
     * directly.
     * @see ChildQuery
     * @example
     * ```html
     * <ul>
     *   <li ng-repeat="user in fp.children().orderByChild('lastName').startAt('B').endAt('Bz').of('users').values">
     *      <span>{{ user.firstName }} {{ user.lastName }} is a user whose last name starts with B!</span>
     *   </li>
     * </ul>
     * ```
     */
    self.children = function() {
      return new ChildQuery(self.listenerSet);
    };
  
  
    $scope.$on('$destroy', function() {
  
      // shut down controller
      self.cleanup();
  
    });
  
  }
  FirebaseCtl.$inject = ["$log", "$q", "$scope", "$injector", "$timeout", "Firebase", "Fireproof", "ChildQuery", "validatePath", "ListenerSet"];
  
  
  angular.module('flashpoint')
  .controller('FirebaseCtl', FirebaseCtl);
  

}));
