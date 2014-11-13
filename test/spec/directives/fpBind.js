
describe('fpBind', function() {

  var FIREBASE_URL = 'https://casetext-goldibex.firebaseio.com';
  var root = new Fireproof(new Firebase(FIREBASE_URL));

  var $scope;

  beforeEach(function(done) {

    module('angular-fireproof.directives.firebaseUrl');
    module('angular-fireproof.directives.fpBind');
    module('angular-firebase.mocks');

    inject(function($compile, $rootScope) {

      $rootScope.done = function(err) {
        done(err);
      };
      var element = angular.element('<div ' +
        'firebase-url="' + FIREBASE_URL  + '" ' +
        'fp-bind="things/something" as="object" watch="true" sync="true"' +
        'on-load="done()" on-error="done($error)"' +
        '></div>');

      $compile(element)($rootScope);
      $rootScope.$digest();
      $scope = element.scope();

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

  it('can send changes to the object back to Firebase', function(done) {

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
