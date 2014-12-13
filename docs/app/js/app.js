
angular.module('flashpointDocs', ['ngRoute', 'flashpoint'])
.config(function($locationProvider, $routeProvider) {

  $locationProvider.html5Mode(true);
  $routeProvider.otherwise({
    template: '<h1>Welcome to Flashpoint!</h1>'
  });

});
