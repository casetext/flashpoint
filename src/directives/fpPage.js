
angular.module('angular-fireproof.directives.fpPage', [
  'angular-fireproof.controllers.PageCtl'
])
.directive('fpPage', function() {

  return {
    restrict: 'A',
    scope: true,
    controller: 'PageCtl'
  };

});

