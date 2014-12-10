
describe('in the Fireproof services,', function() {

  beforeEach(function() {

    module('flashpoint');
    module('flashpoint.mocks.pump');

  });

  describe('Firebase', function() {

    it('returns the Firebase core object', inject(function(Firebase) {
      expect(Firebase).to.include.keys(['goOnline', 'goOffline', 'ServerValue']);
    }));

  });


  describe('ServerValue', function() {

    it('returns the ServerValue object for convenience', inject(function(Firebase, ServerValue) {
      expect(ServerValue).to.equal(Firebase.ServerValue);
    }));

  });


  describe('Fireproof', function() {

    it('returns the Fireproof object', inject(function(Fireproof) {

      expect(Fireproof).to.be.a('function');
      expect(Fireproof).to.include.keys(['stats', 'Demux', 'Pager']);

    }));

  });

});
