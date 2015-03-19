
describe('fpBindChildren', function() {

  var root, scope, el;

  beforeEach(function(done) {

    module('flashpoint');
    module('flashpoint.mocks.pump');

    inject(function($rootScope, $compile) {

      el = angular.element('<ul ' +
        'firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
        'fp-bind-children="fp.path(\'test\', \'children\') | orderByKey | limitToFirst:3" >' +
        '<li fp-child-repeat>{{ $key }}: {{ $value }}</li>' +
        '</ul>');

      $compile(el)($rootScope);
      scope = el.scope();

    });

    scope.fp.onAttach(function(_root_) {

      root = _root_;
      root.child('test/children').set({
        'a': 1,
        'b': 2,
        'c': 3,
        'd': 4,
        'e': 5,
        'f': 6
      })
      .then(function() {
        setTimeout(done, 500);
      }, done);

    });

  });


  it('makes an array of child snapshots available on $children', function() {
    expect(scope.$children.length).to.equal(3);
  });


  it('produces one copy of the template for each child in the list', function() {

    expect(el.children().length).to.equal(3);
    expect(el.children()[0].innerHTML).to.equal('a: 1');
    expect(el.children()[1].innerHTML).to.equal('b: 2');
    expect(el.children()[2].innerHTML).to.equal('c: 3');

  });


  it('automatically reacts to changes in database state', function(done) {

    return root.child('test/children/a').remove()
    .then(function() {

      setTimeout(function() {

        var err;
        try {
          expect(el.children().length).to.equal(3);
          expect(el.children()[0].innerHTML).to.equal('b: 2');
          expect(el.children()[1].innerHTML).to.equal('c: 3');
          expect(el.children()[2].innerHTML).to.equal('d: 4');
        } catch(e) {
          err = e;
        } finally {
          done(err);
        }

      }, 500);

    });

  });

  it('handles disconnection gracefully', function() {



  });


});
