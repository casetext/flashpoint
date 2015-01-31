
describe('onAuth', function() {

  var root = new Firebase(window.__env__.FIREBASE_TEST_URL),
    $scope;

  beforeEach(function() {

    module('flashpoint');
    module('flashpoint.mocks.pump');

    root.unauth();

    inject(function($rootScope, $compile) {

      var el = angular.element('<div firebase="' + window.__env__.FIREBASE_TEST_URL +
        '" on-auth="onAuth($auth)"></div>');
      $compile(el)($rootScope);
      $scope = el.scope();
      $rootScope.$digest();

    });

  });

  afterEach(function() {

    $scope.$destroy();
    root.unauth();

  });

  it('evaluates the expression when the authentication state changes', function(done) {

    $scope.onAuth = function(authData) {
      expect(authData).to.include.keys(['uid', 'provider']);
      done();
    };

    root.authWithCustomToken(window.__env__.FIREBASE_TEST_SECRET, function() {});

  });

});
