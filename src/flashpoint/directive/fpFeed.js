
angular.module('flashpoint')
.directive('fpFeed', function($q, Feed) {

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

});
