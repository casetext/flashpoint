
angular.module('angular-fireproof.directives.fpBind', [
  'angular-fireproof.controllers.BindCtl'
])
.directive('fpBind', function() {

  return {
    restrict: 'A',
    scope: true,
    controller: 'BindCtl',
    link: function(scope, el) {

      scope.$watch('$syncing', function(syncing) {

        if (syncing) {
          el.addClass('syncing');
        } else {
          el.removeClass('syncing');
        }

      });

    }

  };

});

