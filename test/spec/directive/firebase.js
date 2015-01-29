
describe('firebase', function() {

  var $scope, $q, element;

  beforeEach(function() {

    module('flashpoint');

    inject(function($rootScope, $compile, _$q_) {

      $q = _$q_;

      element = angular.element('<div ' + 'firebase="' + window.__env__.FIREBASE_TEST_URL + '"></div>');

      $compile(element)($rootScope);
      $rootScope.$digest();
      $scope = element.scope();

    });

  });

  afterEach(function() {
    $scope.$destroy();
  });

  it('sets "fp" on the directive scope', function() {
    expect($scope.fp).to.be.defined;
  });

});
