
describe('FirebaseCtl', function() {

  var controller, $scope;

  beforeEach(function() {

    module('angular-fireproof.controllers.FirebaseCtl');
    module('angular-firebase.mocks');

    // generate the controller
    inject(function($compile, $rootScope) {

      var el = angular.element('<div ng-controller="FirebaseCtl" '+
        'firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
        '></div>');
      $scope = $rootScope.$new();
      $compile(el)($scope);
      $scope.$digest();
      controller = el.controller();
      controller.root.unauth();

    });

  });

  afterEach(function() {
    $scope.$destroy();
  });

  it('has all the required properties and API endpoints', function() {

    expect(controller).to.include.keys(['auth', 'profile', 'root']);

    ['onProfile', 'offProfile', 'login'].forEach(function(apiMethodName) {
      expect(controller[apiMethodName]).to.be.a('function');
    });

  });

  describe('#onProfile and #offProfile', function() {

    beforeEach(function(done) {
      controller.root.authWithCustomToken(window.__env__.FIREBASE_TEST_SECRET, done);
    });

    afterEach(function() {
      controller.root.unauth();
    });

    it('always calls once initially', function(done) {

      controller.onProfile(function foo()  {
        controller.offProfile(foo);
        done();
      });

    });

    it('calls again on any change in auth state', function(done) {

      controller.onProfile(function bar(profile) {

        if (profile && profile.super) {
          controller.offProfile(bar);
          done();
        }

      });

    });

  });

});
