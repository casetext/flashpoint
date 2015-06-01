
describe('fpFeed', function() {

  function makeEl(elStr, scopeProperties) {

    var promise;

    inject(function($rootScope, $compile, $q) {

     var el = angular.element(elStr);

      $rootScope.feedItems = ['test/feed/a', 'test/feed/b', 'test/feed/c'];

      for (var scopeProperty in scopeProperties) {
        $rootScope[scopeProperty] = scopeProperties[scopeProperty];
      }

      $compile(el)($rootScope);

      var defer = $q.defer();
      var fn = el.scope().fp.onAttach(function() {
        el.scope().fp.offAttach(fn);
        defer.resolve();
      });

      promise = defer.promise
      .then(function() {

        return el.scope().fp.set('test/feed', {

          'a': {
            'a': true,
            'd': true,
            'g': true,
          },

          'b': {
            'b': true,
            'f': true,
            'h': true
          },

          'c': {
            'c': true,
            'e': true,
            'i': true
          }

        });

      })
      .then(function() {
        return el.scope().fp.set('test/things', {
          '0': 'foo',
          '1': 'bar',
          '2': 'baz',
          '3': 'quux',
          '6': '_baz',
          '7': '_quux'
        });

      })
      .then(function() {
        return el.scope().$feed._morePromise;
      })
      .then(function() {
        return {
          el: el,
          scope: el.scope()
        };
      })
      .catch(function(err) {
        console.log(err);
      });

    });

    return promise;

  }

  beforeEach(function() {

    module('flashpoint');
    module('flashpoint.mocks.pump');

  });

  it('exposes all the objects from the combined queries in $feed.items', function() {

    return makeEl('<div firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
        'fp-feed="feedItems" ' +
        'feed-query="$ref.orderByKey()"></div>')
    .then(function(result) {
      expect(result.scope.$feed.items.length).to.equal(9);
    });

  });

  it('transforms based on the value of feed-transform and sorts based on feed-sort', function() {

    return makeEl('<div firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
      'fp-feed="feedItems" ' +
      'feed-sort="$a ? $a : $b" ' +
      'feed-transform="ft($object)" ' +
      'feed-query="$ref.orderByKey()"></div>', {
      ft: function(snap) {
        return snap.val();
      }
    })
    .then(function(result) {
      expect(result.scope.$feed.items).to.deep.equal([true, true, true, true, true, true, true, true, true]);
    });

  });

  it('filters based on the value of feed-filter', function() {

    return makeEl('<div firebase="' + window.__env__.FIREBASE_TEST_URL + '" ' +
      'fp-feed="feedItems" ' +
      'feed-sort="$a ? $a : $b" ' +
      'feed-transform="ft($object)" ' +
      'feed-filter="false" ' +
      'feed-query="$ref.orderByKey()"></div>', {
      ft: function(snap) {
        return snap.val();
      }
    })
    .then(function(result) {
      expect(result.scope.$feed.items.length).to.equal(0);
    });

  });

});
