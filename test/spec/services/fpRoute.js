
describe('flashpoint service', function() {

  var root;

  function runRoutes() {

    inject(function($rootScope, $location, $compile) {

      $location.path('/');

      var element = angular.element('<div ng-view fp-view></div>');
      (angular.element(document.body)).append(element);
      $compile(element)($rootScope);
      $rootScope.$digest();

    });

  }

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


    it('provides an injectable "loaded" method for the FirebaseCtl', function(done) {

      module(function($routeProvider, fpRoute) {

        $routeProvider.otherwise(fpRoute({
          firebase: window.__env__.FIREBASE_TEST_URL,
          template: '<div>{{ fp.val("test/foo") }}</div>',
          loaded: function(root, auth, testInjectable) {
            expect(root).to.be.defined;
            expect(auth).to.be.defined;
            expect(testInjectable).to.equal(1);
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
          template: '<div>{{ fp.val("error/foo") }}</div>',
          loaded: function() {
            done(new Error('loaded should not have been called'));
          },
          error: function(error, testInjectable) {
            expect(testInjectable).to.be.defined;
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
          template: '<div>{{ fp.val("test/foo") }}</div>',
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
          template: '<div>{{ fp.val("test/foo") }}</div>',
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

    it('adds resolve values directly to scope', function(done) {

      module(function($routeProvider, fpRoute) {

        $routeProvider.otherwise(fpRoute({

          firebase: window.__env__.FIREBASE_TEST_URL,
          template: '<div id="test-obj">{{ thingamajig + friend }}</div>',
          resolve: {
            thingamajig: function() {
              return 5;
            },
            friend: function() {
              return 7;
            }
          },
          loaded: function() {

            var element = angular.element(document.getElementById('test-obj'));
            expect(element.text()).to.equal('12');
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
