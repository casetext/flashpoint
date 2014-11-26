

describe('FirebaseCtl', function() {

  var controller, root, $scope;

  before(function(done) {

    this.timeout(10000);

    root = new Firebase(window.__env__.FIREBASE_TEST_URL);

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

  beforeEach(function(done) {

    this.timeout(10000);

    module('angular-firebase.mocks');
    module('angular-fireproof.controllers.FirebaseCtl');

    // generate the controller
    inject(function($compile, $rootScope, $q) {

      var el = angular.element('<div ng-controller="FirebaseCtl" '+
        'firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
        'login-handler="handleLogin()" on-auth-change="done()"' +
        '></div>');

      $rootScope.handleLogin = function() {

        var deferred = $q.defer();

        controller.root.authWithPassword({
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

      $rootScope.done = done;
      $compile(el)($rootScope);
      controller = el.controller();
      $scope = el.scope();

    });

  });

  afterEach(function() {
    $scope.$destroy();
  });


  describe('for user authentication', function() {

    it('sets $auth, $userId, $login, and $logout on scope initially', function() {

      expect($scope.$userId).to.be.null;
      expect($scope.$auth).to.be.null;
      expect($scope.$login).to.be.a('function');
      expect($scope.$logout).to.be.a('function');

    });

    describe('if the user is logged in', function() {

      beforeEach(function() {
        return $scope.$login();
      });

      afterEach(function() {
        return $scope.$logout();
      });

      it('sets $auth, $userId, and $login on scope with the right values', function(done) {

        expect($scope.$auth).to.include.keys(['provider', 'uid']);
        expect($scope.$userId).to.match(/^simplelogin:/);
        done();

      });

    });

  });

});
