
describe('firebase', function() {

  var $scope, $q, element;
  var root = new Firebase(window.__env__.FIREBASE_TEST_URL);

  before(function(done) {

    this.timeout(10000);

    root.child('test/firebase').set({
      value: {
        kind: 'widget',
        id: 5,
        properties: {
          smiley: true,
          displayName: 'La Mer, as performed by Julio Iglesias'
        }
      },
    }, function() {

      root.removeUser({
        email: 'testy@testerson.com',
        password: '12345'
      }, function() {
        root.createUser({
          email: 'testy@testerson.com',
          password: '12345'
        }, function() {
          done();
        });

      });

    });

  });

  beforeEach(function() {

    module('flashpoint');
    module('flashpoint.mocks.pump');

    inject(function($rootScope, $compile, _$q_) {

      $q = _$q_;

      element = angular.element('<div ' +
        'firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
        'ng-init="state = {}" login-handler="handleLogin()">' +
        '<span>{{ state.bar = fp.val("test/firebase/value/kind") }}</span>' +
        '</div>');

      $rootScope.handleLogin = function() {

        var deferred = $q.defer();

        root.authWithPassword({
          email: 'testy@testerson.com',
          password: '12345'
        }, function(err) {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve();
          }
        });

        return deferred.promise;

      };
      $compile(element)($rootScope);
      $rootScope.$digest();
      $scope = element.scope();

    });

  });


  afterEach(function() {
    $scope.$destroy();
  });


  describe('for user authentication', function() {

    it('sets $auth, $login, and $logout on scope initially', function() {

      expect($scope.fp.auth).to.be.null;
      expect($scope.fp.login).to.be.a('function');
      expect($scope.fp.logout).to.be.a('function');

    });

    describe('if the user is logged in', function() {

      beforeEach(function() {
        return $scope.fp.login();
      });

      afterEach(function() {
        return $scope.fp.logout();
      });

      it('sets $auth on scope with the authentication data', function(done) {

        expect($scope.fp.auth).to.include.keys(['provider', 'uid']);
        expect($scope.fp.auth.uid).to.match(/^simplelogin:/);
        done();

      });

    });

  });

});
