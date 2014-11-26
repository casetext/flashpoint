
describe('fpBind', function() {

  var root = new Firebase(window.__env__.FIREBASE_TEST_URL);

  beforeEach(function() {

    module('angular-fireproof.mocks');
    module('angular-fireproof');

  });

  it('evaluates on-error and sets $fireproofError in case of error', function(done) {

    inject(function($rootScope, $compile) {

      var element = angular.element('<div ' +
        'firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
        'fp-bind="invalid/thing" as="object"' +
        'on-load="done()" on-error="done($error)"></div>');

      $rootScope.done = function($error) {

        try {
          expect($error).to.be.an('object');
          expect($error).to.equal(element.scope().$error);
          done();
        } catch(e) { done(e); }

      };

      $compile(element)($rootScope);
      $rootScope.$digest();

    });

  });


  describe('given valid auth', function() {

    before(function(done) {

      root.child('test/something').setWithPriority('cool', 5, function() {
        root.unauth();
        done();
      });

    });

    it('sets the name, val, and priority of the reference on scope', function(done) {

      inject(function($rootScope, $compile) {

        var element = angular.element('<div ' +
          'firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
          'fp-bind="test/something" as="object" ' +
          'on-load="done()" on-error="err($error)"></div>');

        $compile(element)($rootScope);
        var $scope = element.scope();

        $rootScope.err = done;
        $rootScope.done = function() {

          expect($scope.$error).to.be.undefined;
          expect($scope.$val).to.equal('cool');
          expect($scope.object).to.equal('cool');
          expect($scope.$priority).to.equal(5);

          $scope.$destroy();
          done();

        };

        $rootScope.$digest();

      });

    });

    it('watches the value for changes and updates it', function(done) {

      var element;

      inject(function($rootScope, $compile) {

        element = angular.element('<div ' +
          'firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
          'fp-bind="test/something" as="object" ' +
          'on-load="done()" on-error="err($error)"></div>');

        $compile(element)($rootScope);
        var $scope = element.scope();

        $rootScope.done = function() {

          root.child('test/something')
          .setWithPriority('foobar', 7, function() {

            expect($scope.$error).to.be.undefined;
            expect($scope.object).to.equal('foobar');
            expect($scope.$val).to.equal('foobar');
            expect($scope.$priority).to.equal(7);

            $scope.$destroy();
            done();

          });

        };

        $rootScope.err = done;
        $rootScope.$digest();

      });

    });


    it('can sync changes to the object back to Firebase', function(done) {

      var element;

      inject(function($rootScope, $timeout, $compile) {

        element = angular.element('<div ' +
          'firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
          'fp-bind="test/something" as="synctest"' +
          'on-error="error($error)" on-load="loaded()" on-sync="synced()"></div>');

        $compile(element)($rootScope);
        var $scope = element.scope();
        var firstRun;

        $rootScope.loaded = function() {

          if (!firstRun) {

            $scope.synctest = 'bazquux';
            $scope.$priority = 9;

            firstRun = true;
            $scope.$sync();

          }

        };

        $rootScope.synced = function() {

          setTimeout(function() {

            root.child('test/something').once('value', function(snap) {
              expect(snap.val()).to.equal('bazquux');
              expect(snap.getPriority()).to.equal(9);
              done();
            });

          }, 250);

        };
        $rootScope.error = done;
        $rootScope.$digest();

      });

    });

  });

});
