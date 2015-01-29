
angular.module('flashpoint')
.directive('fpPage', function($q, $animate, Fireproof) {

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

});

