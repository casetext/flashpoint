
function fpViewFillContentFactory($compile, $controller, $route, firebaseStatus) {

  return {
    restrict: 'ECA',
    priority: -350,
    terminal: true,
    link: function(scope, $element) {

      var locals = $route.current.locals;

      $element.html(locals.$template);

      var link = $compile($element.contents());

      angular.forEach(locals, function(value, name) {

        if (name.charAt(0) !== '$' && name.charAt(0) !== '_') {
          scope[name] = value;
        }

      });

      locals.$scope = scope;
      var controller = $controller('FirebaseCtl', locals);
      scope.fp = controller;

      $element.data('$firebaseController', controller);
      $element.children().data('$firebaseController', controller);

      firebaseStatus.startRoute();

      link(scope);

    }
  };

}

angular.module('flashpoint')
.directive('fpView', fpViewFillContentFactory);
