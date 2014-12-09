
describe('flashpoint service', function() {

  var root;

  beforeEach(function() {

    root = new Fireproof(new Firebase(window.__env__.FIREBASE_TEST_URL));

    module('flashpoint');
    module('flashpoint.mocks');

  });

  describe('firebaseStatus', function() {

    it('records operations and triggers the flashpointLoaded event', function(done) {

      inject(function($rootScope, $compile) {

        $rootScope.$on('flashpointLoadSuccess', function(e, opsList) {
          expect(opsList.length).to.equal(1);
          expect(opsList[0]).to.have.keys(['type', 'path', 'start', 'end', 'count', 'duration']);
          expect(opsList[0].path).to.match(/test\/foo/);
          done();
        });

        var element;
        sinon.spy($rootScope, '$broadcast');

        element = angular.element('<span ' +
          'firebase="' + window.__env__.FIREBASE_TEST_URL + '"' +
          '>{{ fp.val("test/foo") }}</span>');
        $compile(element)($rootScope);

        $rootScope.$broadcast('$viewContentLoaded');

      });

    });

  });

});
