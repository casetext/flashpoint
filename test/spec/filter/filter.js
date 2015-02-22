
describe('filter', function() {

  var orderByKey, orderByValue, orderByPriority, orderByChild;
  var startAt, endAt, limitToFirst, limitToLast;
  var _fpGetRef;

  beforeEach(function() {

    module('flashpoint');
    inject(function($filter, __fpGetRef_) {

      orderByKey = $filter('orderByKey');
      orderByValue = $filter('orderByValue');
      orderByPriority = $filter('orderByPriority');
      orderByChild = $filter('orderByChild');

      startAt = $filter('startAt');
      endAt = $filter('endAt');
      limitToFirst = $filter('limitToFirst');
      limitToLast = $filter('limitToLast');

      _fpGetRef = __fpGetRef_;

    });

  });

  describe('orderByKey', function() {

    it('augments the string appropriately', function() {

      expect(orderByKey('')).to.equal('.orderByKey');
      expect(orderByKey(null)).to.equal(null);

    });

  });

    describe('orderByValue', function() {

    it('augments the string appropriately', function() {

      expect(orderByValue('')).to.equal('.orderByValue');
      expect(orderByValue(null)).to.equal(null);

    });

  });

  describe('orderByPriority', function() {

    it('augments the string appropriately', function() {

      expect(orderByPriority('')).to.equal('.orderByPriority');
      expect(orderByPriority(null)).to.equal(null);

    });

  });

  describe('orderByChild', function() {

    it('augments the string appropriately', function() {

      expect(orderByChild('', 'someChild')).to.equal('.orderByChild:"someChild"');
      expect(orderByChild('', '')).to.equal(null);

    });

  });

  describe('startAt', function() {

    it('augments the string appropriately', function() {

      expect(startAt('', 'foo')).to.equal('.startAt:"foo"');
      expect(startAt('', 7)).to.equal('.startAt:7');
      expect(startAt('', null)).to.equal('.startAt:null');
      expect(startAt('', false)).to.equal('.startAt:false');

      expect(startAt('', 'foo', 7)).to.equal('.startAt:"foo":7');
      expect(startAt('', 7, 'foo')).to.equal('.startAt:7:"foo"');
      expect(startAt('', null, '')).to.equal('.startAt:null:""');
      expect(startAt('', false, null)).to.equal('.startAt:false');

    });

  });

  describe('endAt', function() {

    it('augments the string appropriately', function() {

      expect(endAt('', 'foo')).to.equal('.endAt:"foo"');
      expect(endAt('', 7)).to.equal('.endAt:7');
      expect(endAt('', null)).to.equal('.endAt:null');
      expect(endAt('', false)).to.equal('.endAt:false');

      expect(endAt('', 'foo', 7)).to.equal('.endAt:"foo":7');
      expect(endAt('', 7, 'foo')).to.equal('.endAt:7:"foo"');
      expect(endAt('', null, '')).to.equal('.endAt:null:""');
      expect(endAt('', false, null)).to.equal('.endAt:false');

    });

  });

  describe('limitToFirst', function() {

    it('augments the string appropriately', function() {

      expect(limitToFirst('', 7)).to.equal('.limitToFirst:7');
      expect(limitToFirst('', '7')).to.equal('.limitToFirst:7');
      expect(limitToFirst('', 'wut')).to.equal(null);

    });

  });

  describe('limitToLast', function() {

    it('augments the string appropriately', function() {

      expect(limitToLast('', 7)).to.equal('.limitToLast:7');
      expect(limitToLast('', '7')).to.equal('.limitToLast:7');
      expect(limitToLast('', 'wut')).to.equal(null);

    });

  });

  describe('associated _fpGetRef function', function() {

    var root;
    beforeEach(function(done) {

      root = new Firebase(window.__env__.FIREBASE_TEST_URL);
      root.child('/test/_fpGetRef').set({
        a: {
          date: 0,
        },
        b: {
          date: 1,
        },
        c: {
          date: 2
        },
        d: {
          date: 3
        },
        e: {
          date: 4
        }
      }, done);

    });

    it('constructs a query out of the serialization correctly', function(done) {

      var query = _fpGetRef(root, '/test/_fpGetRef.orderByChild:"date".startAt:1.endAt:3');
      query.once('value', function(snap) {

        var err;
        try {
          expect(snap.numChildren()).to.equal(3);
          expect(snap.val()).to.include.keys(['b', 'c', 'd']);
        } catch(e) {
          err = e;
        } finally {
          done(err);
        }

      });

    });

  });

});
