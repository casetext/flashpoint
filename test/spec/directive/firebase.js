
describe('firebase', function() {

  var element;

  beforeEach(function() {
    module('flashpoint');
  });

  it('sets "fp" on the directive scope', function() {

    inject(function($rootScope, $compile) {

      element = angular.element('<div firebase="' + window.__env__.FIREBASE_TEST_URL + '"></div>');

      $compile(element)($rootScope);
      $rootScope.$digest();
      expect($rootScope.fp).to.be.defined;

    });

  });

  it('handles interpolated URLs safely', function() {

    inject(function($rootScope, $compile) {

      element = angular.element('<div firebase="{{ url }}"></div>');

      $compile(element)($rootScope);
      $rootScope.$digest();
      expect($rootScope.fp).to.be.defined;
      expect($rootScope.fp.root).not.to.be.defined;
      $rootScope.url = window.__env__.FIREBASE_TEST_URL;
      $rootScope.$digest();
      expect($rootScope.fp).to.be.defined;
      expect($rootScope.fp.root).to.be.defined;

    });

  });

});
