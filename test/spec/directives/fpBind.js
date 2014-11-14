
describe('fpBind', function() {

  var root;
  var $scope;

  beforeEach(function(done) {

    module('angular-fireproof.directives.firebaseUrl');
    module('angular-fireproof.directives.fpBind');
    module('angular-firebase.mocks');

    inject(function(Fireproof) {
      root = new Fireproof(new Firebase(window.__env__.FIREBASE_TEST_URL));
    });

    return root.authWithCustomToken(window.__env__.FIREBASE_TEST_SECRET, function() {

      inject(function($compile, $rootScope) {

        var firstDone = false;
        $rootScope.done = function(error) {

          if (!firstDone) {
            firstDone = true;
            done(error);
          }

        };
        var element = angular.element('<div ' +
          'firebase-url="' + window.__env__.FIREBASE_TEST_URL + '" ' +
          'fp-bind="things/something" as="object" watch="true" sync="true" ' +
          'on-load="done()" on-error="done($error)"' +
          '></div>');

        $compile(element)($rootScope);
        $scope = element.scope();

      });

    });

  });

  it('assigns the value of the reference to the value in "as"', function() {
    expect(angular.isDefined($scope.object)).to.be.true;
  });

  it('watches the value for changes and updates it', function(done) {

    $scope.$watch('object', function(object) {

      if (object === 'foobar') {
        done();
      }

    });

    root.child('things/something').set('foobar');

  });

  it('can sync changes to the object back to Firebase', function(done) {

    root.child('things/something')
    .on('value', function(snap) {

      if (snap.val() === 'bazquux') {
        root.child('things/something').off('value');
        done();
      }

    });

    $scope.object = 'bazquux';

  });

});
