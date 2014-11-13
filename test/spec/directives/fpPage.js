
describe('fpPage', function() {

  var root = new Fireproof(new Firebase(window.__env__.FIREBASE_TEST_URL));

  var $scope;

  beforeEach(function(done) {

    module('angular-fireproof.directives.firebaseUrl');
    module('angular-fireproof.directives.fpPage');
    module('angular-firebase.mocks');

    inject(function(Fireproof) {
      root = new Fireproof(new Firebase(window.__env__.FIREBASE_TEST_URL));
    });

    root.authWithCustomToken(window.__env__.FIREBASE_TEST_SECRET)
    .then(function() {

      return root.child('angular-fireproof/things')
      .set({
        a: { '.value': 0, '.priority': null },
        b: { '.value': 1, '.priority': -1 },
        c: { '.value': 2, '.priority': 0 },
        d: { '.value': 3, '.priority': 1 },
        e: { '.value': 4, '.priority': 2 },
        f: { '.value': 5, '.priority': 3 },
        g: { '.value': 6, '.priority': 'a' },
        h: { '.value': 7, '.priority': 'b' },
        i: { '.value': 8, '.priority': 'c' },
        j: { '.value': 9, '.priority': 'd' },
      });

    })
    .then(inject(function($compile, $rootScope) {

        $rootScope.done = done;
        var element = angular.element('<div ' +
          'firebase-url="' + window.__env__.FIREBASE_TEST_URL  + '" ' +
          'fp-page="angular-fireproof/things" as="things" limit="3"' +
          'on-page="done()" on-error="done($error)"' +
          '></div>');

        $compile(element)($rootScope);
        $scope = element.scope();

    }));

    // digest to set the promise going
    inject(function($rootScope) {
      $rootScope.$digest();
    });

  });


  it('has paging controls mounted directly on scope and on the object', function() {

    expect($scope.things).to.contain.keys(['$next', '$previous', '$reset']);
    expect($scope).to.contain.keys(['$next', '$previous', '$reset']);

  });

  it('initially has the first page of results, ordered by priority', function() {

    expect(Array.isArray($scope.things)).to.be.true;
    expect($scope.things.length).to.equal(3);
    expect($scope.things).to.have.members([0, 1, 2]);
    expect($scope.things.$priorities).to.deep.equal([null, -1, 0]);
    expect($scope.things.$keys).to.deep.equal(['a', 'b', 'c']);

  });

  it('can be moved forward with $next', function() {

    return $scope.$next()
    .then(function() {

      expect($scope.things).to.have.members([3, 4, 5]);
      expect($scope.things.$priorities).to.deep.equal([1, 2, 3]);
      expect($scope.things.$keys).to.deep.equal(['d', 'e', 'f']);

      return $scope.$next();

    })
    .then(function() {

      expect($scope.things).to.have.members([6, 7, 8]);
      expect($scope.things.$priorities).to.deep.equal(['a', 'b', 'c']);
      expect($scope.things.$keys).to.deep.equal(['g', 'h', 'i']);

      return $scope.$next();

    })
    .then(function() {

      expect($scope.things).to.have.members([9]);
      expect($scope.things.$priorities).to.deep.equal(['d']);
      expect($scope.things.$keys).to.deep.equal(['j']);

      return $scope.$next();

    })
    .then(function() {
      expect($scope.$hasNext).to.be.false;
    });

  });

  it('can be moved backward with $previous', function() {

    return $scope.$next()
    .then(function() {
      return $scope.$previous();
    })
    .then(function() {

      expect($scope.things).to.have.members([0, 1, 2]);
      expect($scope.things.$priorities).to.deep.equal([null, -1, 0]);
      expect($scope.things.$keys).to.deep.equal(['a', 'b', 'c']);

      return $scope.$previous();

    })
    .then(function() {
      expect($scope.$hasPrevious).to.be.false;
    });

  });

  it('can be reset with $reset', function() {

    return $scope.$next()
    .then(function() {
      return $scope.$reset();
    })
    .then(function() {

      expect($scope.things).to.have.members([0, 1, 2]);
      expect($scope.things.$priorities).to.deep.equal([null, -1, 0]);
      expect($scope.things.$keys).to.deep.equal(['a', 'b', 'c']);

    });

  });


});
