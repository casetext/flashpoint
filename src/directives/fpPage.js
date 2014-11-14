
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

