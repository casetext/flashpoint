
describe('flashpoint service', function() {

  var root;

  beforeEach(function() {

    root = new Fireproof(new Firebase(window.__env__.FIREBASE_TEST_URL));

    module('flashpoint.mocks.pump');
    module('flashpoint');

  });

  describe('firebaseStatus', function() {

    it('records operations and triggers the flashpointLoadSuccess event', function(done) {

      inject(function($rootScope, $compile) {

        $rootScope.$on('flashpointLoadSuccess', function(e, opsList) {
          expect(opsList.length).to.equal(1);
          expect(opsList[0]).to.have.keys(['id', 'type', 'path', 'start', 'finish', 'duration']);
          expect(opsList[0].path).to.match(/test\/foo/);
          done();
        });

        var element;

        element = angular.element('<span ' +
          'firebase="' + window.__env__.FIREBASE_TEST_URL + '"' +
          '>{{ fp.val("test/foo") }}</span>');
        $compile(element)($rootScope);

        $rootScope.$broadcast('$viewContentLoaded');

      });

    });

  });

});
