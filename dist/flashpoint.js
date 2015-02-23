/*! flashpoint 3.0.0-beta.1, © 2015 J2H2 Inc. MIT License.
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
  .directive('firebase', ["$animate", function($animate) {
  
    /**
     * @ngdoc directive
     * @name firebase
     * @description Wires Firebase into an Angular application.
     *
     * The `firebase` directive is an easy way to make the Firebase controller available
     * to enclosing scope, where it is exposed as `fp`.
     *
     * @restrict A
     * @element ANY
     * @scope
     * @param {expression} firebase Full URL to the Firebase, like
     * `https://my-firebase.firebaseio.com`. Interpolatable.
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
  
      attrs.$observe('firebase', attachToController);
  
      scope.$watch('fp.connected', function(connected) {
  
        if (connected === true) {
          $animate.setClass(el, 'fp-connected', 'fp-disconnected');
        } else if (connected === false) {
          $animate.setClass(el, 'fp-disconnected', 'fp-connected');
        } else {
          $animate.setClass(el, [], ['fp-connected', 'fp-disconnected']);
        }
  
      });
  
      scope.$watch('fp.auth', function(auth) {
  
        if (auth === undefined) {
          $animate.setClass(el, [], ['fp-unauthenticated', 'fp-authenticated']);
        } else if (auth === null) {
          $animate.setClass(el, 'fp-unauthenticated', 'fp-authenticated');
        } else {
          $animate.setClass(el, 'fp-authenticated', 'fp-unauthenticated');
        }
  
      });
  
      scope.$watch('fp.authError', function(authError) {
  
        if (authError) {
          $animate.addClass(el, 'fp-auth-error');
        } else {
          $animate.removeClass(el, 'fp-auth-error');
        }
  
      });
  
      scope.$watch('fp.accountError', function(accountError) {
  
        if (accountError) {
          $animate.addClass(el, 'fp-account-error');
        } else {
          $animate.removeClass(el, 'fp-account-error');
        }
  
      });
  
    }
  
  
    return {
  
      restrict: 'A',
      scope: true,
      controller: 'FirebaseCtl',
      controllerAs: 'fp',
      priority: 1000,
      link: {
        pre: firebasePreLink
      }
  
    };
  
  }]);
  
  
  
  angular.module('flashpoint')
  .directive('fpBindChildren', ["$animate", "$compile", "_fpGetRef", function($animate, $compile, _fpGetRef) {
  
    function fpBindChildrenCompile($templateEl) {
  
      // search the template for fp-child-repeat, that's what we'll repeat on each child
      var template = $templateEl[0].querySelector('[fp-child-repeat]'),
        startPlaceholder = angular.element(document.createComment('fp-child-repeat start')),
        endPlaceholder = angular.element(document.createComment('fp-child-repeat end'));
  
      if (template) {
  
        template = angular.element(template);
        template.after(endPlaceholder);
        template.after(startPlaceholder);
        template.remove();
  
      } else {
        throw new Error('No fp-child-repeat was found in your fp-bind-children!');
      }
  
      return function fpBindChildrenLink(scope, el, attrs, fp) {
  
        var query,
          els = {},
          cancelAttachListener;
  
        scope.$children = [];
  
  
        function find(key) {
  
          // FIXME(goldibex): yes, I know this is linear time
          for (var i = 0; i < scope.$children.length; i++) {
  
            if (scope.$children[i].key() === key) {
              return i;
            }
  
          }
  
          return -1;
  
        }
  
  
        function _attach() {
  
          if (cancelAttachListener) {
            cancelAttachListener();
          }
  
          cancelAttachListener = scope.$watch(attrs.fpBindChildren, function(newQueryStr) {
  
            _detach();
  
            if (newQueryStr) {
  
              try {
  
                query = _fpGetRef(fp.root, newQueryStr);
  
                query.on('child_added', onAdded, onError);
                query.on('child_removed', onRemoved, onError);
                query.on('child_moved', onMoved, onError);
                query.on('child_changed', onChanged, onError);
  
              } catch(e) {
                onError(e);
              }
  
            }
  
          });
  
        }
  
  
        function _detach() {
  
          $animate.removeClass(el, 'fp-bind-children-error');
  
          if (query) {
  
            query.off('child_added', onAdded);
            query.off('child_removed', onRemoved);
            query.off('child_moved', onMoved);
            query.off('child_changed', onChanged);
  
          }
  
          query = null;
  
          scope.$children.forEach(function(child) {
  
            var deadEl = els[child.key()];
            deadEl.remove();
  
          });
  
          scope.$children.length = 0;
  
        }
  
        function onAdded(snap, prevKey) {
  
          var position = find(prevKey)+1;
          scope.$children.splice(position, 0, snap);
  
          var clone = template.clone(),
            cloneScope = scope.$new();
  
          $compile(clone)(cloneScope);
  
          var previousSibling = els[prevKey] || startPlaceholder;
  
          cloneScope.$key = snap.key();
          cloneScope.$value = snap.val();
          cloneScope.$priority = snap.getPriority();
          cloneScope.$index = position;
  
          els[snap.key()] = clone;
  
          $animate.enter(clone, el.parent(), previousSibling);
  
        }
  
        function onRemoved(snap) {
  
          $animate.leave(els[snap.key()]);
  
          var position = find(snap.key());
          scope.$children.splice(position, 1);
  
          $animate.leave(els[snap.key()], el.parent())
          .then(function() {
            els[snap.key()] = null;
          });
  
        }
  
        function onMoved(snap, prevKey) {
  
          var oldPosition = find(snap.key());
          scope.$children.splice(oldPosition, 1);
  
          var newPosition = find(prevKey) + 1;
          scope.$children.splice(newPosition, 0, snap);
  
          els[snap.key()].scope().$key = snap.key();
          els[snap.key()].scope().$value = snap.val();
          els[snap.key()].scope().$priority = snap.getPriority();
          els[snap.key()].scope().$index = newPosition+1;
  
          $animate.move(els[snap.key()], el.parent(), els[prevKey]);
  
        }
  
        function onChanged(snap) {
  
          var position = find(snap.key());
          scope.$children.splice(position, 1, snap);
  
          els[snap.key()].scope().$key = snap.key();
          els[snap.key()].scope().$value = snap.val();
          els[snap.key()].scope().$priority = snap.getPriority();
  
          $animate.addClass(els[snap.key()], 'fp-bind-children-changed')
          .then(function() {
            $animate.removeClass(els[snap.key()], 'fp-bind-children-changed');
          });
  
        }
  
        function onError(err) {
  
          scope.$error = err;
          $animate.addClass(el, 'fp-bind-children-error');
  
        }
  
        var onAttachListener = fp.onAttach(_attach);
        var onDetachListener = fp.onDetach(function() {
  
          if (cancelAttachListener) {
            cancelAttachListener();
            cancelAttachListener = null;
          }
  
          _detach();
  
        });
  
        scope.$on('$destroy', function() {
  
          // remove the comment nodes
          startPlaceholder.remove();
          endPlaceholder.remove();
          if (cancelAttachListener) {
            cancelAttachListener();
          }
          _detach();
  
          fp.offAttach(onAttachListener);
          fp.offDetach(onDetachListener);
  
        });
  
      };
  
    }
  
    return {
      restrict: 'A',
      priority: 900,
      scope: true,
      require: '^firebase',
      compile: fpBindChildrenCompile
    };
  
  }]);
  
  
  angular.module('flashpoint')
  .directive('fpFeed', ["$q", "Feed", function($q, Feed) {
  
    /**
     * @ngdoc directive
     * @name fpFeed
     * @description Gathers objects from a variety of Firebase locations into a single array.
     *
     * The `fpFeed` directive queries a set of Firebase locations that you specify
     * and pools all the retrieved values into a single list, available on scope as $page.
     *
     * @restrict A
     * @element ANY
     * @scope
     *
     * @param {expression} fpFeed An expression that evaluates to an array of absolute
     * paths in Firebase you wish to query, for instance, `["feeds/" + username, "feeds/firehose"]`.
     *
     * @param {expression} feedQuery An expression that evaluates to a query. This will be
     * run over each path you have supplied with the special variables `$ref` and `$start`.
     * Required.
     *
     * @param {expression} feedTransform An optional expression to transform a feed object
     * into another linked object. It receives the
     * special variables `$object` and `$root` and should return
     * either the transformed object or a promise that resolves to the transformed object.
     *
     * @param {expression} feedFilter an optional expression run over each new feed object.
     * It should return true if the object should be kept, false if not.
     * Receives the special variables:
     * - `$object`: the object under consideration.
     * - `$index`: the proposed index of the new object.
     * - `$newItems`: the set of all items about to be appended to the feed.
     * - `$items`: the set of all items currently in the feed.
     *
     * @param {expression} feedSort an optional expression to be evaluated to sort the set of
     * new objects before they're appended to the feed.
     * Receives the special variables:
     * - `$a` or `$left`: the left-hand object in the comparison
     * - `$b` or `$right`: the right-hand object in the comparison
     * Defaults to sorting by key.
     */
  
    function fpFeedLink(scope, el, attrs, fp) {
  
      var onAttachListener = fp.onAttach(function(root) {
  
        scope.$feed = new Feed(scope.$eval(attrs.fpFeed), function(ref, start) {
  
          if (attrs.feedQuery) {
            return scope.$eval(attrs.feedQuery, { $ref: ref, $start: start });
          } else {
            throw new Error('fp-feed requires feed-query to be set');
          }
  
        });
  
        scope.$feed.setTransform(function(object, root) {
  
          if (attrs.feedTransform) {
  
            return scope.$eval(attrs.feedTransform, {
              '$object': object,
              '$root': root
            });
          } else {
            return object;
          }
  
        });
  
        scope.$feed.setFilter(function(object, index, newItems, items) {
  
          if (attrs.feedFilter) {
            return scope.$eval(attrs.feedFilter, {
              '$object': object,
              '$index': index,
              '$newItems': newItems,
              '$items': items
            });
          } else {
            return function() { return true; };
          }
  
        });
  
        scope.$feed.setSort(function(a, b) {
  
          if (attrs.feedSort) {
  
            return scope.$eval(attrs.feedSort, {
              '$a': a,
              '$b': b,
              '$left': a,
              '$right': b
            });
  
          } else {
            return a.ref().toString().localeCompare(b.ref().toString());
          }
  
        });
  
        scope.$feed.connect(root);
  
      });
  
      var onDetachListener = fp.onDetach(function() {
        scope.$feed.disconnect();
      });
  
      scope.$on('$destroy', function() {
  
        fp.offAttach(onAttachListener);
        fp.offDetach(onDetachListener);
  
        scope.$feed.disconnect();
  
      });
  
    }
  
    return {
      require: '^firebase',
      scope: true,
      link: fpFeedLink
    };
  
  }]);
  
  
  angular.module('flashpoint')
  .constant('FP_DEFAULT_PAGE_SIZE', 3)
  .directive('fpPage', ["FP_DEFAULT_PAGE_SIZE", "Page", function(FP_DEFAULT_PAGE_SIZE, Page) {
  
    /**
     * @ngdoc directive
     * @name fpPage
     * @description Pages over the children of a given Firebase location.
     *
     * The `fpPage` directive makes it easy to page over the static children of a
     * given Firebase location. Since, as the Firebase docs describe, the operation of
     * paging over data that changes in real-time is not well-defined, this directive
     * should only be used with Firebase data that changes rarely or not at all.
     * After instantiation, scope will have a variable `$page` of type {link Page}
     * that you can use.
     *
     * @restrict A
     * @element ANY
     * @scope
     *
     * @param {expression} fpPage An expression that evaluates to a Firebase query to
     * be used to retrieve items. Some special functions are provided:
     * - `$orderByPriority(path, size)`: order the children of `path` by priority,
     * and provide at most `size` objects per page.
     * - `$orderByKey(path, size)`: order the children of `path` by key,
     * and provide at most `size` objects per page.
     * - `$orderByValue(path, size)`: order the children of `path` by priority,
     * and provide at most `size` objects per page.
     * - `$orderByValue(path, child, size)`: order the children of `path` by the value of child `child`,
     * and provide at most `size` objects per page.
     * @see {Page}
     */
  
    function fpPageLink(scope, el, attrs, fp) {
  
      function $orderByPriority(path, size) {
  
        size = parseInt(size);
        if (isNaN(size)) {
          size = FP_DEFAULT_PAGE_SIZE;
        }
  
        return function(root, last) {
  
          var query = root.child(path).orderByPriority();
  
          if (last) {
            return query.startAt(last.getPriority(), last.key()).limitToFirst(size+1);
          } else {
            return query.limitToFirst(size);
          }
  
        };
  
      }
  
  
      function $orderByKey(path, size) {
  
        size = parseInt(size);
        if (isNaN(size)) {
          size = FP_DEFAULT_PAGE_SIZE;
        }
  
        return function(root, last) {
  
          var query = root.child(path).orderByKey();
  
          if (last) {
            return query.startAt(last.key()).limitToFirst(size+1);
          } else {
            return query.limitToFirst(size);
          }
  
  
        };
  
      }
  
  
      function $orderByValue(path, size) {
  
        size = parseInt(size);
        if (isNaN(size)) {
          size = FP_DEFAULT_PAGE_SIZE;
        }
  
        return function(root, last) {
  
          var query = root.child(path).orderByValue();
  
          if (last) {
            return query.startAt(last.val(), last.key()).limitToFirst(size+1);
          } else {
            return query.limitToFirst(size);
          }
  
        };
  
      }
  
  
      function $orderByChild(path, child, size) {
  
        size = parseInt(size);
        if (isNaN(size)) {
          size = FP_DEFAULT_PAGE_SIZE;
        }
  
        return function(root, last) {
  
          var query = root.child(path).orderByChild(child);
  
          if (last) {
  
            var lastVal = last.val();
  
            if (angular.isObject(lastVal)) {
              lastVal = lastVal[child];
            } else {
              lastVal = null;
            }
  
            return query.startAt(lastVal, last.key()).limitToFirst(size+1);
  
          } else {
            return query.limitToFirst(size);
          }
  
        };
  
      }
  
      var orderingMethods = {
        $orderByPriority: $orderByPriority,
        $orderByKey: $orderByKey,
        $orderByChild: $orderByChild,
        $orderByValue: $orderByValue
      };
  
      var onAttachListener = fp.onAttach(function(root) {
  
        scope.$page = new Page(scope.$eval(attrs.fpPage, orderingMethods));
        scope.$page.connect(root);
  
      });
  
      var onDetachListener = fp.onDetach(function() {
        scope.$page.disconnect();
      });
  
      scope.$on('$destroy', function() {
  
        fp.offAttach(onAttachListener);
        fp.offDetach(onDetachListener);
  
        scope.$page.disconnect();
  
      });
  
    }
  
    return {
      link: fpPageLink,
      restrict: 'A',
      priority: 750,
      scope: true,
      require: '^firebase'
    };
  
  }]);
  
  
  angular.module('flashpoint')
  .directive('onAuth', function() {
  
    /**
     * @ngdoc directive
     * @name onAuth
     * @description Evaluates an Angular expression on changes in authentication status.
     *
     * The `onAuth` directive hooks into Firebase's `onAuth` expression and evaluates
     * the expression you supply every time authentication status against your Firebase
     * changes. This is useful for managing login state. It supplies the special variable
     * `$auth` to your expression.
     *
     * @restrict A
     * @element ANY
     */
  
    function onAuthPreLink(scope, el, attrs, fp) {
  
      function authHandler(authData) {
  
        if (attrs.onAuth) {
          scope.$eval(attrs.onAuth, { $auth: authData });
        }
  
      }
  
      fp.onAttach(function(root) {
        root.onAuth(authHandler);
      });
  
      fp.onDetach(function(root) {
        root.offAuth(authHandler);
      });
  
    }
  
    return {
      priority: 750,
      require: '^firebase',
      restrict: 'A',
      link: {
        pre: onAuthPreLink
      }
  
    };
  
  });
  
  
  angular.module('flashpoint')
  .directive('onConnect', function() {
  
    /**
     * @ngdoc directive
     * @name onConnect
     * @description Evaluates the given expression on successfully establishing a Firebase connection.
     * Must be supplied together with `firebase`.
     *
     * The `onConnect` directive evaluates the expression you supply whenever the
     * connection to the Firebase is re-established.
     *
     * @restrict A
     * @element ANY
     */
  
    return {
      require: 'firebase',
      link: fpOnConnectLink
    };
  
  });
  
  function fpOnConnectLink(scope, el, attrs, fp) {
  
    var cancel;
  
    var attachListener = fp.onAttach(function() {
  
      cancel = scope.$watch('fp.connected', function(connected) {
  
        if (connected === true) {
          scope.$eval(attrs.onConnect);
        }
  
      });
  
    });
  
    var detachListener = fp.onDetach(function() {
  
      if (cancel) {
        cancel();
        cancel = null;
      }
  
    });
  
    scope.$on('$destroy', function() {
  
      fp.offAttach(attachListener);
      fp.offDetach(detachListener);
  
    });
  
  
  }
  
  
  angular.module('flashpoint')
  .directive('onDisconnect', ["$q", "$log", "validatePath", function($q, $log, validatePath) {
  
    /**
     * @ngdoc directive
     * @name onDisconnect
     * @description Sets a Firebase onDisconnect hook. Must be supplied together with `firebase`.
     *
     * Firebase provides a way to make changes to a database in case the user disconnects,
     * known as "onDisconnect". The `onDisconnect` directive exposes onDisconnect
     * to Angular expressions.
     *
     * The `onDisconnect` expression adds the behavior that when you _detach_ from a Firebase,
     * the expression is also evaluated.
     *
     * NB: `onDisconnect` IS NOT EVALUATED WHEN THE FIREBASE ACTUALLY DISCONNECTS!
     * Instead, it's the equivalent of telling Firebase, "Hey, if you don't hear back
     * from me in a while, do this operation for me." The expression actually gets
     * evaluated right after a successful connection to Firebase.
     *
     * The supplied expression gets access to the special functions `$set`,
     * `$update`, `$setWithPriority`, and `$remove`, all of which behave identically
     * to their counterparts in Firebase using Flashpoint syntax.
     * For instance, ```on-disconnect="$remove('online-users', $auth.name)"```.
     *
     * @restrict A
     * @element ANY
     */
  
    function onDisconnectLink(scope, el, attrs, fp) {
  
      var disconnects = {};
  
      var onDisconnectError = function(err) {
  
        $log.debug('onDisconnect: error evaluating "' + attrs.onDisconnect +
          '": ' + err.code);
  
        if (attrs.onDisconnectError) {
          scope.$eval(attrs.onDisconnectError, { $error: err });
        }
  
      };
  
      var getDisconnectContext = function(root) {
  
        return {
  
          $set: function() {
  
            var args = Array.prototype.slice.call(arguments, 0),
              data = args.pop(),
              path = validatePath(args);
  
            if (path) {
  
              disconnects[path] = true;
              return root.child(path).onDisconnect().set(data)
              .catch(onDisconnectError);
  
            } else {
              return $q.reject(new Error('Invalid path'));
            }
  
          },
  
          $update: function() {
  
            var args = Array.prototype.slice.call(arguments, 0),
              data = args.pop(),
              path = validatePath(args);
  
            if (path) {
  
              disconnects[path] = true;
              return root.child(path).onDisconnect().update(data)
              .catch(onDisconnectError);
  
            } else {
              return $q.reject(new Error('Invalid path'));
            }
  
          },
  
          $setWithPriority: function() {
  
            var args = Array.prototype.slice.call(arguments, 0),
              priority = args.pop(),
              data = args.pop(),
              path = validatePath(args);
  
            if (path) {
  
              disconnects[path] = true;
              return root.child(path).onDisconnect().setWithPriority(data, priority)
              .catch(onDisconnectError);
  
            } else {
              return $q.reject(new Error('Invalid path'));
            }
  
          },
  
          $remove: function() {
  
            var args = Array.prototype.slice.call(arguments, 0),
              path = validatePath(args);
  
            if (path) {
  
              disconnects[path] = true;
              return root.child(path).onDisconnect().remove()
              .catch(onDisconnectError);
  
            } else {
              return $q.reject(new Error('Invalid path'));
            }
  
          }
  
        };
  
      };
  
      var liveContext = {
        $set: fp.set.bind(fp),
        $remove: fp.remove.bind(fp),
        $setWithPriority: fp.setWithPriority.bind(fp),
        $update: fp.update.bind(fp)
      };
  
  
      var attachListener = fp.onAttach(function(root) {
  
        // attach disconnect to this Firebase
        scope.$eval(attrs.onDisconnect, getDisconnectContext(root));
  
      });
  
  
      var detachListener = fp.onDetach(function(root) {
  
        for (var disconnectPath in disconnects) {
  
          // cancel the disconnect expression, then actually run it
          // (because detaching is effectively disconnecting)
          root.child(disconnectPath).onDisconnect().cancel();
  
          scope.$eval(attrs.onDisconnect, liveContext);
  
        }
  
        disconnects = {};
  
      });
  
      scope.$on('$destroy', function() {
        fp.offAttach(attachListener);
        fp.offDetach(detachListener);
      });
  
    }
  
    return {
      require: 'firebase',
      restrict: 'A',
      link: onDisconnectLink
    };
  
  }]);
  
  
  angular.module('flashpoint')
  .filter('orderByKey', function() {
  
    return function(str) {
  
      if (!angular.isString(str)) {
        return null;
      } else {
        return str + '.orderByKey';
      }
  
    };
  
  })
  .filter('orderByValue', function() {
  
    return function(str) {
  
      if (!angular.isString(str)) {
        return null;
      } else {
        return str + '.orderByValue';
      }
  
    };
  
  })
  .filter('orderByPriority', function() {
  
    return function(str) {
  
      if (!angular.isString(str)) {
        return null;
      } else {
        return str + '.orderByPriority';
      }
  
    };
  
  })
  .filter('orderByChild', function() {
  
  
    return function(str, child) {
  
      if (!angular.isString(str) || !angular.isString(child) || child.length === 0) {
        return null;
      } else {
        return str + '.orderByChild:' + JSON.stringify(child);
      }
  
    };
  
  })
  .filter('startAt', function() {
  
    return function(str, startAt, startAtKey) {
  
      if (startAt === undefined) {
        return null;
      } else {
        str += '.startAt:' + JSON.stringify(startAt);
      }
  
      if (angular.isString(startAtKey) || angular.isNumber(startAtKey)) {
        return str + ':' + JSON.stringify(startAtKey);
      } else {
        return str;
      }
  
    };
  
  })
  .filter('endAt', function() {
  
    return function(str, endAt, endAtKey) {
  
      if (endAt === undefined) {
        return null;
      } else {
        str += '.endAt:' + JSON.stringify(endAt);
      }
  
      if (angular.isString(endAtKey) || angular.isNumber(endAtKey)) {
        return str + ':' + JSON.stringify(endAtKey);
      } else {
        return str;
      }
  
    };
  
  })
  .filter('limitToFirst', function() {
  
    return function(str, limitToFirst) {
  
      limitToFirst = parseInt(limitToFirst);
  
      if (isNaN(limitToFirst)) {
        return null;
      } else {
        return str + '.limitToFirst:' + JSON.stringify(limitToFirst);
      }
  
    };
  
  })
  .filter('limitToLast', function() {
  
    return function(str, limitToLast) {
  
      limitToLast = parseInt(limitToLast);
  
      if (isNaN(limitToLast)) {
        return null;
      } else {
        return str + '.limitToLast:' + JSON.stringify(limitToLast);
      }
  
    };
  
  })
  .constant('_fpGetRef', function(root, str) {
  
    if (str === null) {
      return null;
    } else {
  
      var params = str.split(/\./g),
        query = root.child(params.shift());
  
      return params.reduce(function(query, part) {
  
        var name = part.split(':')[0],
          args = part.split(':').slice(1).map(function(item) { return JSON.parse(item); });
  
        switch(name) {
        case 'orderByKey':
        case 'orderByValue':
        case 'orderByPriority':
          return query[name]();
        case 'orderByChild':
        case 'startAt':
        case 'endAt':
        case 'limitToFirst':
        case 'limitToLast':
          return query[name].apply(query, args);
        }
  
      }, query);
  
    }
  
  });
  
  
  angular.module('flashpoint')
  .factory('Feed', ["$q", function($q) {
  
    function Feed(paths, queryFn) {
  
      if (arguments.length < 2) {
        throw new Error('Feed expects at least 2 arguments, got ' + arguments.length);
      }
  
      if (!angular.isArray(paths)) {
        paths = [paths];
      }
  
  
      this._queryFn = queryFn;
  
      this._positions = paths.reduce(function(obj, path) {
  
        obj[path] = undefined;
        return obj;
  
      }, {});
      this._presence = {};
      this.items = [];
  
    }
  
    Feed.prototype._transformFn = function(obj) {
      return obj;
    };
  
    Feed.prototype._filterFn = function() {
      return true;
    };
  
    Feed.prototype.setTransform = function(fn) {
      this._transformFn = fn;
      return this;
    };
  
    Feed.prototype.setSort = function(fn) {
      this._sortFn = fn;
      return this;
    };
  
    Feed.prototype.setFilter = function(fn) {
      this._filterFn = fn;
      return this;
    };
  
    Feed.prototype.more = function() {
  
      var self = this;
  
      if (!self._morePromise) {
  
        self._morePromise = $q.all(Object.keys(self._positions).map(function(path) {
  
          return self._queryFn(self.root.child(path), self._positions[path])
          .then(function(snap) {
  
            var promises = [];
            snap.forEach(function(feedEntry) {
  
              if (!self._presence.hasOwnProperty(feedEntry.ref().toString())) {
  
                self._presence[feedEntry.ref().toString()] = true;
                promises.push($q.when(self._transformFn(feedEntry, self.root)));
                self._positions[path] = feedEntry;
  
              }
  
            });
  
            return $q.all(promises);
  
          });
  
        }))
        .then(function(feedResultsArrays) {
  
          var allResults = feedResultsArrays
          .reduce(function(allResults, feedResultArray) {
            return allResults.concat(feedResultArray);
          }, [])
          .filter(function(object, index, array) {
            return self._filterFn(object, index, array, self.items);
          });
  
          if (self._sortFn) {
            allResults.sort(self._sortFn);
          }
  
          allResults.forEach(function(result) {
            self.items.push(result);
          });
  
          self._morePromise = null;
  
        });
  
      }
  
      return self._morePromise;
  
    };
  
    Feed.prototype.connect = function(root) {
  
      this.disconnect();
      this.root = root;
      return this.more();
  
    };
  
    Feed.prototype.disconnect = function() {
  
      this._positions = Object.keys(this._positions).reduce(function(obj, path) {
  
        obj[path] = undefined;
        return obj;
  
      }, {});
      this._presence = {};
      this.items.length = 0;
  
    };
  
    return Feed;
  
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
  
      self.root = root;
      self.scope = scope;
  
      function scrubListeners() {
  
        var newWatchers = {};
  
        for (var path in self.watchers) {
  
          if (self.watchers[path] && self.liveWatchers[path]) {
            newWatchers[path] = self.watchers[path];
          } else {
            self.remove(path);
          }
  
        }
  
        // as of now, nothing is alive.
        self.watchers = newWatchers;
        self.liveWatchers = {};
        scrubbingListeners = false;
  
      }
  
      self.scope.$watch(function() {
  
        // after each scope cycle, sweep out any "orphaned" listeners, i.e.,
        // ones we previously connected but don't need anymore.
  
        if (!scrubbingListeners) {
  
          scrubbingListeners = true;
          scope.$$postDigest(scrubListeners);
  
        }
  
      });
  
    }
  
    ListenerSet.prototype.add = function(path) {
  
      var self = this;
  
      self.liveWatchers[path] = true;
  
      if (!self.watchers[path]) {
  
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
  
    };
  
  
    ListenerSet.prototype.has = function(path) {
      return this.watchers.hasOwnProperty(path);
    };
  
  
    ListenerSet.prototype.remove = function(path) {
  
      if (this.watchers[path]) {
  
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
  
      }
  
    };
  
  
    ListenerSet.prototype.clear = function() {
  
      for (var path in this.watchers) {
        this.remove(path);
      }
  
      this.watchers = {};
  
    };
  
    return ListenerSet;
  
  });
  
  
  angular.module('flashpoint')
  .factory('Page', ["$q", function($q) {
  
    function Page(pagingFn) {
  
      this._pagingFn = pagingFn;
      this._pages = [];
      this._presence = {};
  
      this.items = [];
  
      this.keys = [];
      this.priorities = [];
      this.values = [];
  
  
      this.disconnect();
  
    }
  
  
    Page.prototype.connect = function(root) {
  
      this.disconnect();
  
      this.root = root;
      return this.next();
  
    };
  
  
    Page.prototype.disconnect = function() {
  
      this.root = null;
      this._pages.length = 0;
  
      this.items.length = 0;
      this.keys.length = 0;
      this.values.length = 0;
      this.priorities.length = 0;
  
      this.number = 0;
      this._presence = {};
  
    };
  
  
    Page.prototype._handleSnap = function(snap) {
  
      var newPage = [],
        presence = this._presence;
  
      snap.forEach(function(child) {
  
        if (!presence.hasOwnProperty(child.key()) ) {
  
          presence[child.key()] = true;
          newPage.push(child);
  
        }
  
      });
  
      if (newPage.length > 0) {
        this._pages.push(newPage);
        this._setPage(this._pages.length);
      } else {
        this._lastPage = this.number;
      }
  
      this._currentOperation = null;
  
    };
  
  
    Page.prototype.next = function() {
  
      if (!this.hasNext()) {
  
        // nothing to set.
        return $q.when();
  
      } else if (this._pages.length > this.number) {
  
        // we already have the page, just copy its contents into this.items
        this._setPage(this.number+1);
        return $q.when();
  
      } else if (this._currentOperation) {
        return this._currentOperation;
      } else if (this._pages.length === 0) {
  
        this._currentOperation = this._pagingFn(this.root, null)
        .then(this._handleSnap.bind(this));
  
        return this._currentOperation;
  
      } else if (this._pages[this._pages.length-1].length > 0) {
  
        var lastPage = this._pages[this._pages.length-1];
  
        this._currentOperation = this._pagingFn(this.root, lastPage[lastPage.length-1])
        .then(this._handleSnap.bind(this));
  
        return this._currentOperation;
  
      } else {
        return $q.when();
      }
  
    };
  
  
    Page.prototype.hasNext = function() {
      return this.hasOwnProperty('root') && this._lastPage !== this.number;
    };
  
  
    Page.prototype.hasPrevious = function() {
      return this.hasOwnProperty('root') && this.number > 1;
    };
  
  
    Page.prototype.previous = function() {
  
      if (this.hasPrevious()) {
        this._setPage(this.number-1);
      }
  
      return $q.when();
  
    };
  
  
    Page.prototype.reset = function() {
      return this.connect(this.root);
    };
  
  
    Page.prototype._setPage = function(pageNumber) {
  
      this.items.length = 0;
      this.keys.length = 0;
      this.values.length = 0;
      this.priorities.length = 0;
  
      this._pages[pageNumber-1].forEach(function(item) {
  
        this.items.push(item);
        this.keys.push(item.key());
        this.values.push(item.val());
        this.priorities.push(item.getPriority());
  
      }, this);
  
      this.number = pageNumber;
  
    };
  
  
    return Page;
  
  }]);
  
  
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
    $scope,
    $q,
    Firebase,
    Fireproof,
    validatePath,
    ListenerSet) {
  
    /**
     * @ngdoc type
     * @name FirebaseCtl
     * @module flashpoint
     * @description The core controller responsible for binding
     * Firebase data into Angular.
     *
     * @property {Firebase} root The root of the instantiated Firebase store.
     *
     * @property {Boolean} connected The state of the network connection to Firebase.
     * This will be:
     * - `true`, if there is a good network connection to Firebase
     * - `false`, if the connection to Firebase is interrupted or not available
     * - `undefined` if the connection state is not known
     *
     * @property {Object} auth The authentication data from Firebase. This will be:
     * - `null`, if the user is not authenticated
     * - `undefined`, if the authentication state is not yet known
     * - an `Object`, containing information about the currently-authenticated user
     *
     * @property {Error} authError The error reported by the most recent attempt to
     * authenticate to Firebase, or `null` otherwise.
     *
     * @property {Error} accountError The error reported by the most recent attempt
     * to perform an account-related action on Firebase, or `null` otherwise.
     *
     * @property {Boolean} accountChanging True if an account-changing action
     * (password reset, user delete, etc.) is in progress, false otherwise.
     *
     * @property {Boolean} authenticating True if an authentication attempt is
     * in progress, false otherwise.
     */
  
    var self = this;
  
    var _attachListeners = [],
      _detachListeners = [];
  
    self.auth = null;
    self.authError = null;
    self.accountError = null;
    self.authenticating = false;
    self.accountChanging = false;
  
    function authHandler(authData) {
  
      if (self.listenerSet) {
        self.listenerSet.clear();
      }
      self.auth = authData;
  
      $scope.$evalAsync();
  
    }
  
  
    function connectedListener(snap) {
  
      self.connected = snap.val();
      $scope.$evalAsync();
  
    }
  
  
    function authPassHandler(auth) {
  
      self.authenticating = false;
      self.authError = null;
      return auth;
  
    }
  
  
    function authErrorHandler(err) {
  
      self.authenticating = true;
      self.authError = err;
      return $q.reject(err);
  
    }
  
  
    function accountPassHandler() {
  
      self.accountChanging = false;
      self.accountError = null;
  
    }
  
  
    function accountErrorHandler(err) {
  
      self.accountChanging = false;
      self.accountError = err;
      return $q.reject(err);
  
    }
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#detachFirebase
     * @description Removes and detaches all connections to Firebase used by
     * this controller.
     */
    self.detachFirebase = function() {
  
      // detach all watchers
      if (self.listenerSet) {
  
        self.listenerSet.clear();
        delete self.listenerSet;
  
      }
  
      // detach any remaining listeners here.
      self.root.offAuth(authHandler);
  
      self.root.child('.info/connected').off('value', connectedListener);
      delete self.connected;
  
      // detach all listeners to prevent leaks.
      self.root.off();
  
      self.auth = null;
      self.authError = null;
      self.accountError = null;
      self.authenticating = false;
      self.accountChanging = false;
  
      _detachListeners.forEach(function(listener) {
        listener(self.root);
      });
  
      // remove the actual root object itself, as it's now invalid.
      delete self.root;
  
      $scope.$evalAsync();
  
    };
  
  
    self.onDetach = function(fn) {
  
      _detachListeners.push(fn);
  
      if (!self.root) {
        fn();
      }
  
      return fn;
  
    };
  
  
    self.offDetach = function(fn) {
      _detachListeners.splice(_detachListeners.indexOf(fn), 1);
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
        self.detachFirebase();
      }
  
      self.root = new Fireproof(new Firebase(url));
  
      self.listenerSet = new ListenerSet(self.root, $scope);
      self.root.onAuth(authHandler);
  
      // maintain knowledge of connection status
      // we assume, optimistically, that we're connected initially
      self.connected = true;
      self.root.child('.info/connected')
      .on('value', connectedListener);
  
      _attachListeners.forEach(function(listener) {
        listener(self.root);
      });
  
    };
  
    self.onAttach = function(fn) {
  
      _attachListeners.push(fn);
  
      if (self.root) {
        fn(self.root);
      }
  
      return fn;
  
    };
  
  
    self.offAttach = function(fn) {
      _attachListeners.splice(_attachListeners.indexOf(fn), 1);
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#goOffline
     * @description Disables the connection to the remote Firebase server. NOTE:
     * this method affects _all_ FirebaseCtl instances on the page.
     * @see Firebase.goOffline
     */
    self.goOffline = function() {
      Firebase.goOffline();
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#goOnline
     * @description Enables the connection to the remote Firebase server. NOTE:
     * this method affects _all_ FirebaseCtl instances on the page.
     * @see Firebase.goOnline
     */
    self.goOnline = function() {
      Firebase.goOnline();
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#unauth
     * @description Unauthenticates (i.e., logs out) the Firebase connection.
     * @see Fireproof#unauth
     */
    self.unauth = function() {
  
      self.authError = null;
      self.accountError = null;
  
      self.root.unauth();
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#authWithCustomToken
     * @description Authenticates using a custom token or Firebase secret.
     * @param {String} token The token to authenticate with.
     * @returns {Promise} that resolves on success and rejects on error.
     * @see Fireproof#authWithCustomToken
     */
    self.authWithCustomToken = function(token) {
  
      self.authenticating = true;
  
      return self.root.authWithCustomToken(token)
      .then(authPassHandler, authErrorHandler);
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#authAnonymously
     * @description Authenticates using a new, temporary guest account.
     * @param {Object} options
     * @returns {Promise} that resolves on success and rejects on error.
     * @see Fireproof#authAnonymously
     */
    self.authAnonymously = function(options) {
  
      self.authenticating = true;
  
      return self.root.authAnonymously(null, options)
      .then(authPassHandler, authErrorHandler);
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#authWithPassword
     * @description Authenticates using an email / password combination.
     * @param {String} email
     * @param {String} password
     * @returns {Promise} that resolves on success and rejects on error.
     * @see Fireproof#authWithPassword
     */
    self.authWithPassword = function(email, password) {
  
      self.authenticating = true;
  
      return self.root.authWithPassword({ email: email, password: password })
      .then(authPassHandler, authErrorHandler);
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#authWithOAuthPopup
     * @description Authenticates using a popup-based OAuth flow.
     * @param {String} provider
     * @param {Object} options
     * @returns {Promise} that resolves on success and rejects on error.
     * @see Fireproof#authWithOAuthPopup
     */
    self.authWithOAuthPopup = function(provider, options) {
  
      self.authenticating = true;
  
      return self.root.authWithOAuthPopup(provider, null, options)
      .then(authPassHandler, authErrorHandler);
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#authWithOAuthToken
     * @description Authenticates using OAuth access tokens or credentials.
     * @param {String} provider
     * @param {Object} credentials
     * @param {Object} options
     * @returns {Promise} that resolves on success and rejects on error.
     * @see Fireproof#authWithOAuthToken
     */
    self.authWithOAuthToken = function(provider, credentials, options) {
  
      self.authenticating = true;
  
      return self.root.authWithOAuthToken(provider, credentials, null, options)
      .then(authPassHandler, authErrorHandler);
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#createUser
     * @description Creates a new user account using an email / password combination.
     * @param {String} email
     * @param {String} password
     * @returns {Promise} that resolves on success and rejects on error.
     * @see Fireproof#createUser
     */
    self.createUser = function(email, password) {
  
      self.accountChanging = true;
  
      return self.root.createUser({ email: email, password: password })
      .then(accountPassHandler, accountErrorHandler);
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#removeUser
     * @description Removes an existing user account using an email / password combination.
     * @param {String} email
     * @param {String} password
     * @returns {Promise} that resolves on success and rejects on error.
     * @see Fireproof#removeUser
     */
    self.removeUser = function(email, password) {
  
      self.accountChanging = true;
  
      return self.root.removeUser({ email: email, password: password })
      .then(accountPassHandler, accountErrorHandler);
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#changeEmail
     * @description Updates the email associated with an email / password user account.
     * @param {String} oldEmail
     * @param {String} newEmail
     * @param {String} password
     * @returns {Promise} that resolves on success and rejects on error.
     * @see Fireproof#changeEmail
     */
    self.changeEmail = function(oldEmail, newEmail, password) {
  
      self.accountChanging = true;
  
      return self.root.changeEmail({
        oldEmail: oldEmail,
        newEmail: newEmail,
        password: password
      })
      .then(accountPassHandler, accountErrorHandler);
  
    };
  
  
    /**
     * @ngdoc method
     * @name changePassword
     * @description Changes the password of an existing user using an email / password combination.
     * @param {String} email
     * @param {String} oldPassword
     * @param {String} newPassword
     * @returns {Promise} that resolves on success and rejects on error.
     * @see Fireproof#changePassword
     */
    self.changePassword = function(email, oldPassword, newPassword) {
  
      self.accountChanging = true;
  
      return self.root.changePassword({
        email: email,
        oldPassword: oldPassword,
        newPassword: newPassword
      })
      .then(accountPassHandler, accountErrorHandler);
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#resetPassword
     * @description Sends a password-reset email to the owner of the account,
     * containing a token that may be used to authenticate and change the user's password.
     * @param {String} email
     * @returns {Promise} that resolves on success and rejects on error.
     * @see Fireproof#resetPassword
     */
    self.resetPassword = function(email) {
  
      self.accountChanging = true;
  
      return self.root.resetPassword({ email: email })
      .then(accountPassHandler, accountErrorHandler);
  
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
  
      if (path && self.listenerSet.errors.hasOwnProperty(path)) {
        return self.listenerSet.errors[path];
      } else {
        return null;
      }
  
    };
  
  
    /**
     * @ngdoc method
     * @name FirebaseCtl#path
     */
    self.path = function() {
  
      var path = validatePath(Array.prototype.slice.call(arguments, 0));
  
      if (path) {
        return path;
      } else {
        return null;
      }
  
    };
  
  
    $scope.$on('$destroy', function() {
  
      // shut down controller
      self.detachFirebase();
  
    });
  
  }
  FirebaseCtl.$inject = ["$scope", "$q", "Firebase", "Fireproof", "validatePath", "ListenerSet"];
  
  
  angular.module('flashpoint')
  .controller('FirebaseCtl', FirebaseCtl);
  

}));
