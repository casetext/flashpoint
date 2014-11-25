
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

