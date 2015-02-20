
angular.module('flashpoint')
.directive('onDisconnect', function($q, $log, validatePath) {

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

});
