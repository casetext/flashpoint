
describe('fpPage', function() {

  var root = new Firebase(window.__env__.FIREBASE_TEST_URL);

  var $scope;

  beforeEach(function(done) {

    module('flashpoint');
    module('flashpoint.mocks.pump');

    root.authWithCustomToken(window.__env__.FIREBASE_TEST_SECRET, function() {

      root.child('test/pager')
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
      }, inject(function($compile, $rootScope) {

        var html = '<div ' +
          'firebase="' + window.__env__.FIREBASE_TEST_URL  + '" ' +
          'fp-page="$orderByPriority(\'test/pager\')" ' +
          '></div>';

        var element = angular.element(html);

        $compile(element)($rootScope);
        $scope = element.scope();
        $rootScope.$digest();
        done();

      }));

    });

  });


  it('has the Page object mounted on scope as $page', function() {
    expect($scope.$page).to.be.defined;
  });

  it('initially has the first page of results, ordered by priority', function() {

    return $scope.$page._currentOperation.then(function() {
      expect($scope.$page.number).to.equal(1);
      expect(Array.isArray($scope.$page.items)).to.be.true;
      expect($scope.$page.items.length).to.equal(3);
      expect($scope.$page.values).to.have.members([0, 1, 2]);
      expect($scope.$page.priorities).to.deep.equal([null, -1, 0]);
      expect($scope.$page.keys).to.deep.equal(['a', 'b', 'c']);
    });

  });

  it('can be moved forward with $page.next', function() {

    return $scope.$page._currentOperation.then(function() {
      return $scope.$page.next();
    })
    .then(function() {

      expect($scope.$page.hasNext()).to.be.true;
      expect($scope.$page.hasPrevious()).to.be.true;

      expect($scope.$page.number).to.equal(2);
      expect($scope.$page.values).to.have.members([3, 4, 5]);
      expect($scope.$page.priorities).to.deep.equal([1, 2, 3]);
      expect($scope.$page.keys).to.deep.equal(['d', 'e', 'f']);

      return $scope.$page.next();

    })
    .then(function() {

      expect($scope.$page.number).to.equal(3);
      expect($scope.$page.values).to.have.members([6, 7, 8]);
      expect($scope.$page.priorities).to.deep.equal(['a', 'b', 'c']);
      expect($scope.$page.keys).to.deep.equal(['g', 'h', 'i']);

      return $scope.$page.next();

    })
    .then(function() {

      expect($scope.$page.number).to.equal(4);
      expect($scope.$page.values).to.have.members([9]);
      expect($scope.$page.priorities).to.deep.equal(['d']);
      expect($scope.$page.keys).to.deep.equal(['j']);

      return $scope.$page.next();

    })
    .then(function() {
      expect($scope.$page.hasNext()).to.be.false;
    });

  });

  it('can be moved backward with $page.previous', function() {

    return $scope.$page._currentOperation.then(function() {
      return $scope.$page.next();
    })
    .then(function() {
      return $scope.$page.next();
    })
    .then(function() {
      return $scope.$page.previous();
    })
    .then(function() {

      expect($scope.$page.number).to.equal(2);
      expect($scope.$page.values).to.have.members([3, 4, 5]);
      expect($scope.$page.priorities).to.deep.equal([1, 2, 3]);
      expect($scope.$page.keys).to.deep.equal(['d', 'e', 'f']);

      return $scope.$page.previous();

    })
    .then(function() {

      expect($scope.$page.number).to.equal(1);
      expect($scope.$page.values).to.have.members([0, 1, 2]);
      expect($scope.$page.priorities).to.deep.equal([null, -1, 0]);
      expect($scope.$page.keys).to.deep.equal(['a', 'b', 'c']);
      expect($scope.$page.hasPrevious()).to.be.false;
      expect($scope.$page.hasNext()).to.be.true;

      return $scope.$page.next();

    })
    .then(function() {

      expect($scope.$page.number).to.equal(2);
      expect($scope.$page.values).to.have.members([3, 4, 5]);
      expect($scope.$page.priorities).to.deep.equal([1, 2, 3]);
      expect($scope.$page.keys).to.deep.equal(['d', 'e', 'f']);
      expect($scope.$page.hasNext()).to.be.true;
      expect($scope.$page.hasPrevious()).to.be.true;

    });

  });

  it('can be reset with $page.reset', function() {

    return $scope.$page._currentOperation.then(function() {
      return $scope.$page.next();
    })
    .then(function() {
      return $scope.$page.reset();
    })
    .then(function() {

      expect($scope.$page.number).to.equal(1);
      expect($scope.$page.values).to.have.members([0, 1, 2]);
      expect($scope.$page.priorities).to.deep.equal([null, -1, 0]);
      expect($scope.$page.keys).to.deep.equal(['a', 'b', 'c']);

    });

  });


});
