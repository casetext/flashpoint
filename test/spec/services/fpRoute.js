
describe('flashpoint service', function() {

  var root;

  beforeEach(function() {

    root = new Fireproof(new Firebase(window.__env__.FIREBASE_TEST_URL));
    root.unauth();

    module('flashpoint');
    module('flashpoint.mocks');
    module('ngRoute');

  });

  describe('fpRoute', function() {

    it('injects FirebaseCtl into a route definition', inject(function(fpRoute) {

      var routeDefinition = fpRoute({ firebase: window.__env__.FIREBASE_TEST_URL });
      expect(routeDefinition.controller).to.equal('FirebaseCtl');

    }));

    it('provides an injectable "loaded" method for the FirebaseCtl', function(done) {

      module(function($routeProvider, fpRoute) {

        $routeProvider.otherwise(fpRoute({
          firebase: window.__env__.FIREBASE_TEST_URL,
          template: '<div fp-bind="test/foo" as="thing"></div>',
          loaded: function(root, auth, $location) {
            expect(root).to.be.defined;
            expect($location).to.be.defined;
            done();
          },
          error: done
        }));

      });

      inject(function($rootScope, $location, $compile) {

        $location.path('/');

        var element = angular.element('<div ng-view></div>');

        $compile(element)($rootScope);
        $rootScope.$digest();

      });

    });

    it('provides an injectable "error" method for the FirebaseCtl', function(done) {

      module(function($routeProvider, fpRoute) {

        $routeProvider.otherwise(fpRoute({

          firebase: window.__env__.FIREBASE_TEST_URL,
          template: '<div fp-bind="error/foo" as="thing"></div>',
          loaded: function() {
            done(new Error('loaded should not have been called'));
          },
          error: function(error, $location) {
            expect(error).to.be.defined;
            done();
          }

        }));

      });

      inject(function($rootScope, $location, $compile) {

        $location.path('/');

        var element = angular.element('<div ng-view></div>');

        $compile(element)($rootScope);
        $rootScope.$digest();

      });

    });

  });

});
