
describe('firebaseUrl', function() {

  var FIREBASE_URL = 'https://' + Math.random().toString(36).slice(2) + '.firebaseio-demo.com';

  beforeEach(function() {

    module('angular-fireproof.directives.firebaseUrl');
    module('angular-firebase.mocks');

  });

  it('installs a Fireproof reference on $scope as "$fireproof"', function() {

    var $scope;

    inject(function($compile, $rootScope) {

      var element = angular.element('<div ' +
        'firebase-url="' + FIREBASE_URL  + '" ' +
        '></div>');

      $compile(element)($rootScope);
      $rootScope.$digest();
      $scope = element.scope();

    });

    expect(angular.isDefined($scope.$fireproof)).to.be.true;
    expect($scope.$fireproof).to.be.an.instanceof(Fireproof);
    expect($scope.$fireproof.toString()).to.equal(FIREBASE_URL);

  });

});
