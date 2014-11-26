
/**
 * @ngdoc module:angular-fireproof.directives.fpPage
 */
angular.module('angular-fireproof.directives.fpPage', [
  'angular-fireproof.directives.firebase',
  'angular-fireproof.services.status'
])
/**
 * @ngdoc directive
 * @name angular-fireproof.directives.fpPage:fpPage
 * @description Pages over the keys at a Firebase location.
 *
 * Exposes the following variables on local scope:
 *
 * | Variable       | Type                 | Details                                                    |
 * |----------------|----------------------|------------------------------------------------------------|
 * | `$next`        | {@type function}     | Fetches the next set of values into scope.                 |
 * | `$previous`    | {@type function}     | Fetches the previous set of values into scope.             |
 * | `$reset`       | {@type function}     | Starts again at the beginning.                             |
 * | `$keys`        | {@type string|array} | The keys in the current page.                              |
 * | `$values`      | {@type *|array}      | The valuees in the current page.                           |
 * | `$priorities`  | {@type *|array}      | The priorities in the current page.                        |
 * | `$hasNext`     | {@type boolean}      | True if there are more values to page over.                |
 * | `$hasPrevious` | {@type boolean}      | True if there are previous values to page back over again. |
 * | `$paging`      | {@type boolean}      | True if a paging operation is currently in progress.       |
 * | `$pageNumber`  | {@type number}       | The current page number of results.                        |
 *
 *
 * @restrict A
 * @element ANY
 * @scope
 * @param {expression} fpPage Path to the location in the Firebase, like
 * `favorites/{{ $auth.uid }}`. Interpolatable.
 * @param {expression} as The name of a variable on scope to bind. So you could do
 * something like
 * `<example fp-page="users/{{ $auth.uid }}" as="users">
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
.directive('fpPage', function($q, Fireproof) {

  return {

    restrict: 'A',
    scope: true,
    require: '^firebase',
    link: function(scope, el, attrs, firebase) {

      var ref, pager, direction;

      var setPage = function(snaps) {

        // set page number here
        if (direction === 'next') {
          scope.$pageNumber++;
        } else {
          scope.$pageNumber--;
        }

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

        scope.$pageNumber = 0;
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

