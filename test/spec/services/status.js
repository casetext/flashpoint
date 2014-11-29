
describe('in the Fireproof services,', function() {

  var root;

  beforeEach(function() {

    root = new Fireproof(new Firebase(window.__env__.FIREBASE_TEST_URL));

    module('angular-fireproof');
    module('angular-fireproof.mocks');

  });


  describe('_firebaseStatus', function() {

    it('records operations and triggers the loaded event', inject(function($rootScope, $timeout, _firebaseStatus) {

      sinon.spy($rootScope, '$broadcast');

      var id = _firebaseStatus.start(root, 'set');
      _firebaseStatus.finish(id);

      $timeout.flush();
      expect($rootScope.$broadcast).to.have.been.calledWith('angular-fireproof:loaded');

    }));

  });

});
