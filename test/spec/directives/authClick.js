
describe('authClick', function() {

  var controller, el, $scope;

  beforeEach(function(done) {

    this.timeout(10000);

    module('angular-fireproof.controllers.FirebaseCtl');
    module('angular-fireproof.directives.authClick');
    module('angular-firebase.mocks');

    // generate the controller
    inject(function($compile, $document, $rootScope) {

      el = angular.element('<div ng-controller="FirebaseCtl" '+
        'firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
        'profile-path="users" ' +
        'login-handler="handleLogin($root)">' +
        '<button auth-click="state.didIt = true" ' +
        'on-auth-error="handleAuthError($error)" ' +
        'auth-condition="$user.human == \'yes!\'"> ' +
        '</button></div>');

      $scope = $rootScope.$new();
      $scope.state = { didIt: false };

      $compile(el)($scope);
      $scope.$digest();
      controller = el.controller();

    });

    controller.root.createUser({
      email: 'testy@testerson.com',
      password: '12345'
    }, function() {

      controller.root.authWithPassword({
        email: 'testy@testerson.com',
        password: '12345'
      }, function(err, auth) {

        if (err) {
          done(err);
        }

        controller.root.child('users').child(auth.uid)
        .set({
          name: 'Testy Testerson',
          human: 'yes!'
        }, done);

      });

    });

  });


  afterEach(function(done) {

    controller.root.removeUser({
      email: 'testy@testerson.com',
      password: '12345'
    }, function() {
      $scope.$destroy();
      done();
    });

  });


  describe('if the user is not logged in', function() {

    beforeEach(function() {
      controller.root.unauth();
    });

    it('triggers the login handler', function() {

      $scope.handleLogin = function() { $scope.state.handleLoginCalled = true; };
      el.find('button').triggerHandler('click');
      $scope.$digest();
      expect($scope.state.handleLoginCalled).to.be.true;

    });

    it('evaluates the expression if the auth flow passes', function(done) {

      $scope.handleLogin = function($root) {

        return $root.authWithPassword({
          email: 'testy@testerson.com',
          password: '12345'
        });

      };

      $scope.$watch('state.didIt', function(didIt) {

        if (didIt === true) {
          done();
        }

      });

      el.find('button').triggerHandler('click');
      $scope.$digest();

    });

    it('does not evaluate the expression if the auth flow fails', function(done) {

      var error = new Error('WUT');
      $scope.handleLogin = function() {

        var rejection;
        inject(function($q) {
          rejection = $q.reject(error);
        });

        return rejection;

      };

      $scope.handleAuthError = function($error) {
        expect($scope.state.didIt).to.equal(false);
        expect($error).to.equal(error);
        done();
      };

      el.find('button').triggerHandler('click');
      $scope.$digest();

    });

  });

  describe('if the user is logged in', function() {

    it('evaluates the expression', function() {

    });

  });

});
