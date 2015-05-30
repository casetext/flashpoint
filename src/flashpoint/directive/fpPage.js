
angular.module('flashpoint')
.constant('FP_DEFAULT_PAGE_SIZE', 3)
.directive('fpPage', function(FP_DEFAULT_PAGE_SIZE, FPPage) {

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

      scope.$page = new FPPage(scope.$eval(attrs.fpPage, orderingMethods));
      scope.$page.connect(root);

    });

    var onDetachListener = fp.onDetach(function() {

      if (scope.$page) {
        scope.$page.disconnect();
      }

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
    require: '^firebase'
  };

});
