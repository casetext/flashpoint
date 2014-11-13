
describe('firebaseUrl', function() {

  beforeEach(function() {

    module('angular-fireproof.directives.firebaseUrl');
    module('angular-firebase.mocks');

  });

  it('installs a Fireproof reference on $scope as "$fireproof"', function() {

    var $scope;

    inject(function($compile, $rootScope) {

      var element = angular.element('<div ' +
        'firebase-url="' + window.__env__.FIREBASE_TEST_URL  + '" ' +
        '></div>');

      $compile(element)($rootScope);
      $rootScope.$digest();
      $scope = element.scope();

    });

    expect(angular.isDefined($scope.$fireproof)).to.be.true;
    expect($scope.$fireproof).to.be.an.instanceof(Fireproof);
    expect($scope.$fireproof.toString()).to.equal(window.__env__.FIREBASE_TEST_URL);

  });

});
