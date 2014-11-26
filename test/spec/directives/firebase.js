
describe('firebase', function() {

  var $scope, element;
  var root = new Firebase(window.__env__.FIREBASE_TEST_URL);

  before(function(done) {

    this.timeout(5000);

    root.child('test/firebase').set({
      value: {
        kind: 'widget',
        id: 5,
        properties: {
          smiley: true,
          displayName: 'La Mer, as performed by Julio Iglesias'
        }
      },
      array: {
        'a': true,
        'b': true,
        'c': true
      }
    }, done);

  });

  beforeEach(function() {
    module('angular-fireproof.directives.firebase');
  });

  describe('$val', function() {

    beforeEach(function() {

      inject(function($rootScope, $compile) {

        element = angular.element('<div ' +
          'firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
          'on-change="changed = true">' +
          '<span>{{ $val("test/firebase/value/kind") }}</span>' +
          '</div>');

        $compile(element)($rootScope);
        $rootScope.$digest();
        $scope = element.scope();

      });

    });

    afterEach(function() {
      $scope.$destroy();
    });


    it('is a method on scope to get Firebase values', function(done) {

      expect($scope.$val).to.be.a('function');
      expect(element.find('span').text()).to.equal('');

      var cancel = $scope.$watch('changed', function(didChange) {

        if (didChange) {
          expect(element.find('span').text()).to.equal('widget');
          cancel();
          done();
        }

      });

    });

  });

});
