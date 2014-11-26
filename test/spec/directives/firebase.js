
describe('firebase', function() {

  var $scope, element;
  var root = new Firebase(window.__env__.FIREBASE_TEST_URL);

  before(function(done) {

    root.child('test/firebase').set({
      value: {
        kind: 'widget',
        id: 5,
        properties: {
          smiley: true,
          displayName: 'La Mer, as performed by Julio Iglesias'
        }
      },
    }, done);

  });

  beforeEach(function() {

    module('angular-firebase.mocks');
    module('angular-fireproof.directives.firebase');

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


  describe('$val', function() {

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


  describe('$set', function() {

    it('is a method to set Firebase values', function() {

      return $scope.$set('test/firebase/set', true).now()
      .then(function() {
        return expect(new Fireproof(root.child('test/firebase/set'))).to.be.true;
      });

    });

  });


  describe('$setPriority', function() {

    it('is a method to set Firebase priorities', function() {

      return $scope.$setPriority('test/firebase/set', 7).now()
      .then(function() {
        return expect(new Fireproof(root.child('test/firebase/set')))
        .to.have.priority(7);
      });

    });

  });


  describe('$setWithPriority', function() {

    it('is a method to set Firebase values with priority', function() {

      return $scope.$setWithPriority('test/firebase/set', 'baz', 9).now()
      .then(function() {
        return expect(new Fireproof(root.child('test/firebase/set')))
        .to.equal('baz');
      })
      .then(function() {
        return expect(new Fireproof(root.child('test/firebase/set')))
        .to.have.priority(9);
      });

    });

  });


  describe('$update', function() {

    it('is a method to update Firebase values', function() {

      var updateVal = {
        control: 'Smiley now'
      };

      return $scope.$update('test/firebase/value/properties', updateVal).now()
      .then(function() {

        return expect(new Fireproof(root.child('test/firebase/value/properties')))
        .to.deep.equal({
          control: 'Smiley now',
          smiley: true,
          displayName: 'La Mer, as performed by Julio Iglesias'
        });

      });

    });

  });


  describe('$remove', function() {

    it('is a method to remove Firebase values', function() {

      return $scope.$remove('test/firebase/set').now()
      .then(function() {
        return expect(new Fireproof(root.child('test/firebase/set'))).to.be.null;
      });

    });

  });


});
