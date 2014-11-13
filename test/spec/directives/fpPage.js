
describe('fpPage', function() {

  var FIREBASE_URL = 'https://' + Math.random().toString(36).slice(2) + '.firebaseio-demo.com';
  var root = new Fireproof(new Firebase(FIREBASE_URL));

  var $scope;

  beforeEach(function(done) {

    module('angular-fireproof.directives.firebaseUrl');
    module('angular-fireproof.directives.fpPage');
    module('angular-firebase.mocks');

    inject(function($compile, $rootScope) {

      $rootScope.done = function() {
        done();
      };
      var element = angular.element('<div ' +
        'firebase-url="' + FIREBASE_URL  + '" ' +
        'fp-bind="things/something" as="object"' +
        'on-load="done()" on-error="done($error)"' +
        '></div>');

      $compile(element)($rootScope);
      $rootScope.$digest();
      $scope = element.scope();

    });

  });


});
