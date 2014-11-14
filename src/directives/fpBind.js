
angular.module('angular-fireproof.directives.fpBind', [
  'angular-fireproof.controllers.FirebaseUrlCtl',
  'angular-fireproof.controllers.BindCtl'
])
.directive('fpBind', function() {

  return {

    restrict: 'A',
    scope: true,
    controller: 'BindCtl',
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

