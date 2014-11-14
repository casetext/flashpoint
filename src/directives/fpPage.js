
angular.module('angular-fireproof.directives.fpPage', [
  'angular-fireproof.controllers.FirebaseUrlCtl',
  'angular-fireproof.controllers.PageCtl'
])
.directive('fpPage', function() {

  return {

    restrict: 'A',
    scope: true,
    controller: 'PageCtl',
    require: '^firebaseUrl',
    link: function(scope, el) {

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

