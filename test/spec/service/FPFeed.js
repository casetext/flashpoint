
describe('FPFeed', function() {

  var root, FPFeed;


  beforeEach(function() {

    module('flashpoint');
    module('flashpoint.mocks.pump');

    inject(function(_FPFeed_, Firebase, Fireproof) {
      FPFeed = _FPFeed_;
      root = new Fireproof(new Firebase(window.__env__.FIREBASE_TEST_URL));
    });

    return root.child('test/feeds')
    .set({

      'a': {
        '0': true,
        '3': true,
        '5': true,
      },

      'b': {
        '1': true,
        '5': true,
        '6': true
      },

      'c': {
        '2': true,
        '4': true,
        '7': true
      }

    })
    .then(function() {
      return root.child('test/things')
      .set({
        '0': 'foo',
        '1': 'bar',
        '2': 'baz',
        '3': 'quux',
        '6': '_baz',
        '7': '_quux'
      });
    });

  });

  describe('#more', function() {

    var feed;

    beforeEach(function() {

      feed = new FPFeed(['test/feeds/a', 'test/feeds/b', 'test/feeds/c'], function(ref, start) {

        if (start) {

          return ref.orderByKey()
          .startAt(start.key())
          .limitToFirst(2);

        } else {
          return ref.orderByKey().limitToFirst(2);
        }

      });

      feed.connect(root);

    });

    it('retrieves objects from a set of Firebase paths according to a uniform query', function() {

      return feed.more(root)
      .then(function() {

        expect(feed.items.length).to.equal(6);

        feed.items.forEach(function(item) {
          expect(['0','1','2','3','4','5']).to.include(item.key());
        });

      });

    });

    it('automatically filters according to the supplied filter function', function() {

      feed.setFilter(function(snap) {
        return (parseInt(snap.key()) % 2) === 0;
      });

      return feed.more(root)
      .then(function() {

        expect(feed.items.length).to.equal(3);
        feed.items.forEach(function(item) {
          expect(parseInt(item.key()) % 2).to.equal(0);
        });

      });

    });

    it('automatically transforms retrieved objects by the supplied transform function', function() {

      feed.setTransform(function(snap) {

        return root.child('test/things').child(snap.key())
        .then(function(snap) {
          return snap.val();
        });

      });

      return feed.more(root)
      .then(function() {
        expect(feed.items).to.include('foo');
        expect(feed.items).to.include('bar');
        expect(feed.items).to.include('baz');
        expect(feed.items).to.include('quux');
      });

    });

    it('automatically sorts retrieved objects by the supplied sort function', function() {

      feed.setTransform(function(snap) {

        return root.child('test/things').child(snap.key())
        .then(function(snap) {
          return snap.val();
        });

      });

      feed.setFilter(function(obj) {
        return obj !== null;
      });

      feed.setSort(function(a, b) {

        if (b && a) {
          return b.localeCompare(a);
        } else {
          return b;
        }

      });

      return feed.more(root)
      .then(function() {

        expect(feed.items).to.deep.equal(['quux', 'foo', 'baz', 'bar']);
        return feed.more(root);

      })
      .then(function() {

        // we expect that the "next" set of items returned by "more" is always _appended_,
        // i.e., that the whole array is not reordered
        expect(feed.items).to.deep.equal(['quux', 'foo', 'baz', 'bar', '_quux', '_baz']);

      });

    });

  });


});
