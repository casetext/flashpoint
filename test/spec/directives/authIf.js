
describe('authIf', function() {

  var controller, el, $scope;

  beforeEach(function(done) {

    this.timeout(10000);

    module('angular-fireproof.controllers.FirebaseCtl');
    module('angular-fireproof.directives.authIf');
    module('angular-firebase.mocks');

    // generate the controller
    inject(function($compile, $rootScope) {

      el = angular.element('<div ng-controller="FirebaseCtl" '+
        'firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
        'profile-path="users" ' +
        'login-handler="handleLogin()">' +
        '<button auth-if="$profile.human == \'yes!\'" class="foo"></button>' +
        '</div>');
      $compile(el)($rootScope);
      $rootScope.$digest();
      controller = el.controller();
      $scope = el.scope();

    });

    controller.root.createUser({
      email: 'testy@testerson.com',
      password: '12345'
    }, done);

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

    it('does not exist', function() {
      expect(el.find('button').length).to.equal(0);
    });

  });

  describe('if the user is logged in', function() {

    beforeEach(function(done) {

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

    it('exists', function() {
      expect(el.find('button').length).to.equal(1);
    });

  });

});
