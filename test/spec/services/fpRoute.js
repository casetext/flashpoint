
function runRoutes() {

  inject(function($rootScope, $location, $compile) {

    $location.path('/');

    var element = angular.element('<div ng-view></div>');

    $compile(element)($rootScope);
    $rootScope.$digest();

  });

}

describe('flashpoint service', function() {

  var root;

  beforeEach(function() {

    root = new Fireproof(new Firebase(window.__env__.FIREBASE_TEST_URL));
    root.unauth();

    module('flashpoint');
    module('flashpoint.mocks');
    module('ngRoute');
    module(function($provide) {
      $provide.value('testInjectable', 1);
    });

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

      runRoutes();

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

      runRoutes();

    });

    it('provides an injectable "challenge" method to try auth', function(done) {

       module(function($routeProvider, fpRoute) {

        $routeProvider.otherwise(fpRoute({

          firebase: window.__env__.FIREBASE_TEST_URL,
          template: '<div fp-bind="error/foo" as="thing"></div>',
          challenge: function(testInjectable, root) {
            return root.authWithCustomToken(window.__env__.FIREBASE_TEST_SECRET);
          },
          loaded: function(root, auth) {
            expect(auth).to.be.an.instanceof(Object);
            expect(auth).to.include.keys(['auth', 'expires', 'token', 'uid', 'provider']);
            root.unauth();
            done();
          },
          error: function(error) {
            root.unauth();
            done(error);
          }

        }));

      });

      runRoutes();

    });

    it('provides an injectable "authorize" method to eval auth', function(done) {

      var didAuthorize = false;
      module(function($routeProvider, fpRoute) {

        $routeProvider.otherwise(fpRoute({

          firebase: window.__env__.FIREBASE_TEST_URL,
          template: '<div fp-bind="error/foo" as="thing"></div>',
          authorize: function(testInjectable, auth) {
            didAuthorize = true;
            return auth === null;
          },
          loaded: function() {
            expect(didAuthorize).to.be.true;
            done();
          },
          error: function(error) {
            done(error);
          }

        }));

      });

      runRoutes();

    });

    it('provides an injectable "extraData" method to add properties to scope', function(done) {

      module(function($routeProvider, fpRoute) {

        $routeProvider.otherwise(fpRoute({

          firebase: window.__env__.FIREBASE_TEST_URL,
          template: '<div id="test-obj">{{ thingamajig + friend }}</div>',
          extraData: function($q) {
            return {
              thingamajig: $q.when(5),
              friend: $q.when(7)
            };
          },
          loaded: function() {
            expect(angular.element(document.getElementById('test-obj'))).text()
            .to.equal('12');
            done();
          },
          error: function(error) {
            done(error);
          }

        }));

      });

      runRoutes();

    });

  });

});
