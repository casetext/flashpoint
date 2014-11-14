
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

