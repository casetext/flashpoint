
describe('FPPage', function() {

  var root, FPPage, page;

  beforeEach(function() {

    module('flashpoint');
    module('flashpoint.mocks.pump');

    inject(function(_FPPage_, Fireproof, Firebase) {
      FPPage = _FPPage_;
      root = new Fireproof(new Firebase(window.__env__.FIREBASE_TEST_URL));
    });

    return root.child('test/pages')
    .set({
      'a': true,
      'b': true,
      'c': true,
      'd': true,
      'e': true,
      'f': true,
      'g': true
    })
    .then(function() {
      page = new FPPage(function(root, last) {

        var query = root.child('test/pages').orderByPriority().limitToFirst(5);
        if (last) {
          query = query.startAt(last.getPriority(), last.key());
        }
        return query;

      });
    });

  });


  describe('after instantiation', function() {

    it('initially retrieves a page of objects according to the supplied parameters', function() {

      return page.connect(root)
      .then(function() {

        expect(page.items.length).to.equal(5);
        expect(page.items[0].key()).to.equal('a');
        expect(page.items[1].key()).to.equal('b');
        expect(page.items[2].key()).to.equal('c');
        expect(page.items[3].key()).to.equal('d');
        expect(page.items[4].key()).to.equal('e');

        page.disconnect();

      });

    });

  });


  describe('#next', function() {

    it('retrieves the next page of objects', function() {

      return page.connect(root)
      .then(function() {

        expect(page.hasNext(), 'initial load').to.be.true;
        expect(page.hasPrevious(), 'initial load').to.be.false;
        expect(page.number, 'initial load').to.equal(1);

        return page.next();

      })
      .then(function() {

        expect(page.hasNext(), 'second page hasNext').to.be.true;
        expect(page.hasPrevious(), 'second page hasPrevious').to.be.true;
        expect(page.number, 'second page number').to.equal(2);

        expect(page.items.length, 'items length').to.equal(2);
        expect(page.items[0].key(), 'item#0 key').to.equal('f');
        expect(page.items[1].key(), 'item#1 key').to.equal('g');

        return page.next();

      })
      .then(function() {

        expect(page.number, 'nonexistent third page').to.equal(2);
        expect(page.items.length, 'nonexistent third page').to.equal(2);
        expect(page.hasNext(), 'nonexistent third page hasNext').to.equal(false);
        expect(page.hasPrevious(), 'nonexistent third page hasPrevious').to.be.true;

      })
      .finally(function() {
        page.disconnect();
      });

    });

    it('does not break when we hit the caching threshold', function() {

      page = new FPPage(function(root, last) {

        var query = root.child('test/pages').orderByPriority();

        if (last) {
          query = query.startAt(last.getPriority(), last.key()).limitToFirst(2);
        } else {
          query = query.limitToFirst(1);
        }

        return query;

      });

      return page.connect(root)
      .then(function() {

        expect(page.hasNext(), 'p1').to.be.true;
        expect(page.hasPrevious(), 'p1').to.be.false;
        expect(page.number, 'p1').to.equal(1);
        expect(page.items.length, 'p1').to.equal(1);
        expect(page.items[0].key(), 'p1').to.equal('a');

        return page.next();

      })
      .then(function() {

        expect(page.hasNext(), 'p2').to.be.true;
        expect(page.hasPrevious(), 'p2').to.be.true;
        expect(page.number, 'p2').to.equal(2);
        expect(page.items.length, 'p2').to.equal(1);
        expect(page.items[0].key(), 'p2').to.equal('b');

        return page.next();

      })
      .then(function() {

        expect(page.hasNext(), 'p3').to.be.true;
        expect(page.hasPrevious(), 'p3').to.be.true;
        expect(page.number, 'p3').to.equal(3);
        expect(page.items.length, 'p3').to.equal(1);
        expect(page.items[0].key(), 'p3').to.equal('c');

        return page.next();

      })
      .then(function() {

        expect(page.hasNext(), 'p4').to.be.true;
        expect(page.hasPrevious(), 'p4').to.be.true;
        expect(page.number, 'p4').to.equal(4);
        expect(page.items.length, 'p4').to.equal(1);
        expect(page.items[0].key(), 'p4').to.equal('d');

        return page.next();

      })
      .then(function() {

        expect(page.hasNext(), 'p5').to.be.true;
        expect(page.hasPrevious(), 'p5').to.be.true;
        expect(page.number, 'p5').to.equal(5);
        expect(page.items.length, 'p5').to.equal(1);
        expect(page.items[0].key(), 'p5').to.equal('e');

        return page.next();

      })
      .then(function() {

        expect(page.hasNext(), 'p6').to.be.true;
        expect(page.hasPrevious(), 'p6').to.be.true;
        expect(page.number, 'p6').to.equal(6);
        expect(page.items.length, 'p6').to.equal(1);
        expect(page.items[0].key(), 'p6').to.equal('f');

        return page.next();

      })
      .then(function() {

        expect(page.hasNext(), 'p6').to.be.true;
        expect(page.hasPrevious(), 'p6').to.be.true;
        expect(page.number, 'p6').to.equal(7);

        expect(page.items.length, 'p6').to.equal(1);
        expect(page.items[0].key(), 'p6').to.equal('g');

        return page.next();

      })
      .then(function() {

        expect(page.hasNext(), 'p7').to.be.false;
        expect(page.hasPrevious(), 'p7').to.be.true;
        expect(page.number, 'p7').to.equal(7);

      })
      .finally(function() {
        page.disconnect();
      });

    });

  });


  describe('#previous', function() {

    it('retrieves the preceding page of objects', function() {

      return page.connect(root)
      .then(function() {
        expect(page.number).to.equal(1);
        return page.next();
      })
      .then(function() {
        expect(page.number).to.equal(2);
        return page.previous();
      })
      .then(function() {

        expect(page.number).to.equal(1);

        expect(page.items.length).to.equal(5);
        expect(page.items[0].key()).to.equal('a');
        expect(page.items[1].key()).to.equal('b');
        expect(page.items[2].key()).to.equal('c');
        expect(page.items[3].key()).to.equal('d');
        expect(page.items[4].key()).to.equal('e');

        return page.previous();

      })
      .then(function() {

        expect(page.hasNext()).to.be.true;
        expect(page.hasPrevious()).to.be.false;
        expect(page.number).to.equal(1);

      })
      .finally(function() {
        page.disconnect();
      });

    });

  });

});
