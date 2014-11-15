
describe('FirebaseCtl', function() {

  var controller, $scope;

  beforeEach(function(done) {

    this.timeout(10000);

    module('angular-fireproof.controllers.FirebaseCtl');
    module('angular-firebase.mocks');

    // generate the controller
    inject(function($compile, $rootScope) {

      var el = angular.element('<div ng-controller="FirebaseCtl" '+
        'firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
        'profile-path="users" ' +
        'login-handler="handleLogin()"' +
        '></div>');
      $compile(el)($rootScope);
      $rootScope.$digest();
      controller = el.controller();
      $scope = el.scope();

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


  describe('when profile-path is provided', function() {

    describe('#onProfile', function() {

      it('hands back the user profile object', function(done) {

        controller.onProfile(function(profile) {

          if (profile && profile.human === 'yes!') {
            done();
          }

        });

      });

    });

  });

});
