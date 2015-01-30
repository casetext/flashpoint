
describe('fpOnDisconnect', function() {

  var root = new Firebase(window.__env__.FIREBASE_TEST_URL),
    $scope;

  beforeEach(function(done) {

    module('flashpoint');
    module('flashpoint.mocks.pump');

    root.child('test/disconnect').remove(done);

  });

  afterEach(function() {
    $scope.$destroy();
  });

  it('evaluates its argument to create an onDisconnect on the associated firebase', function() {

    inject(function($rootScope, $compile) {

      var el = angular.element('<div firebase="' + window.__env__.FIREBASE_TEST_URL +
        '" fp-on-disconnect="promise = $set(\'test\', \'disconnect\', true)"></div>');

      $compile(el)($rootScope);
      $scope = el.scope();
      $rootScope.$digest();

    });

    return $scope.promise.then(function() {

      Firebase.goOffline();
      Firebase.goOnline();

      return expect($scope.fp.root.child('test/disconnect')).to.equal(true);

    });

  });

  it('evaluates fpOnDisconnectError in case of error', function(done) {

    inject(function($rootScope, $compile) {

      var el = angular.element('<div firebase="' + window.__env__.FIREBASE_TEST_URL +
        '" fp-on-disconnect-error="done($error)" fp-on-disconnect="$set(\'error\', \'disconnect\', true)"></div>');

      $compile(el)($rootScope);
      $scope = el.scope();
      $scope.done = function(err) {
        expect(err.code).to.be.defined;
        done();
      };

      $rootScope.$digest();

    });

  });

});
