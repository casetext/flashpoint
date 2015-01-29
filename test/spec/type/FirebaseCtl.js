

describe('FirebaseCtl', function() {

  var fp, $rootScope, root;
  var r = new Firebase(window.__env__.FIREBASE_TEST_URL);

  before(function(done) {

    this.timeout(10000);

    r.child('test/firebase').set({
      value: {
        kind: 'widget',
        id: 5,
        properties: {
          smiley: true,
          displayName: 'La Mer, as performed by Julio Iglesias'
        }
      },
      children: {
        'a': {
          '.value': false,
          '.priority': null
        },
        'b': {
          '.value': false,
          '.priority': null
        },
        'c': {
          '.value': true,
          '.priority': 0
        },
        'd': {
          '.value': true,
          '.priority': 0
        },
        'e': {
          '.value': 0,
          '.priority': 1
        },
        'f': {
          '.value': 1,
          '.priority': 2,
        },
        'g': {
          '.value': 'hello',
          '.priority': 'hello',
        },
        'h': {
          '.value': 'world',
          '.priority': 'world'
        }
      }
    }, function() {

      r.removeUser({
        email: 'testy@testerson.com',
        password: '12345'
      }, function() {
        r.createUser({
          email: 'testy@testerson.com',
          password: '12345'
        }, function() {
          done();
        });

      });

    });

  });

  beforeEach(function() {

    this.timeout(10000);

    module(function($provide) {
      // use Kris Kowal's Q here to get out of the digest cycle
      $provide.value('$q', Q);
    });
    module('flashpoint');

    // generate the controller
    inject(function(_$rootScope_, $controller, Fireproof) {

      $rootScope = _$rootScope_;
      fp = $controller('FirebaseCtl', { $scope: $rootScope });
      fp.attachFirebase(window.__env__.FIREBASE_TEST_URL);
      root = new Fireproof(r);

    });

  });


  describe('val', function() {

    it('listens and gets Firebase values', function(done) {

      expect(fp.val).to.be.a('function');
      expect(fp.val('test/firebase/value/id')).to.be.null;
      setTimeout(function() {
        expect(fp.val('test/firebase/value/id')).to.equal(5);
        done();
      }, 250);

    });

    it('garbage collects disconnected listeners between scope cycles', function() {

      $rootScope.$apply(function() {
        expect(fp.val('test/firebase/lol')).to.be.null;
        expect(fp.val('test/firebase/wut')).to.be.null;
      });

      // a scope cycle goes by in which the same values are not requested...
      $rootScope.$digest();

      // and then both listeners should be detached
      expect(fp.listenerSet.watchers['test/firebase/lol']).to.be.null;
      expect(fp.listenerSet.watchers['test/firebase/wut']).to.be.null;

    });

  });

  describe('children', function() {

    it('returns a LiveArray of Firebase children', function(done) {

      expect(fp.children).to.be.a('function');
      var array = fp.children().orderByKey().startAt('b').endAt('d').of('test/firebase/children');
      expect(array).to.be.an.instanceof(Fireproof.LiveArray);
      expect(fp.children().endAt('d').startAt('b').orderByKey().of('test/firebase/children'))
      .to.equal(array);

      setTimeout(function() {
        expect(array.keys).to.deep.equal(['b', 'c', 'd']);
        expect(array.values).to.deep.equal([false, true, true]);
        expect(array.priorities).to.deep.equal([null, 0, 0]);
        root.child('test/firebase/children/b1').set(true)
        .then(function() {
          expect(array.keys).to.deep.equal(['b', 'b1', 'c', 'd']);
        });
        done();

      }, 250);

    });

    it('garbage collects disconnected listeners between scope cycles', function() {

      $rootScope.$apply(function() {
        expect(fp.children().of('test/firebase/children')).to.exist;
      });

      // a scope cycle goes by in which the same value is not requested...
      $rootScope.$digest();

      // and then the listener should be detached
      expect(fp.listenerSet.watchers['test/firebase/children.children']).to.be.null;

    });

  });


  describe('set', function() {

    it('sets values on the controller Firebase instance', function() {

      return fp.set('test/firebase/set', true)
      .then(function() {
        return expect(root.child('test/firebase/set')).to.be.true;
      });

    });

  });


  describe('setPriority', function() {

    it('sets priorities on the controller Firebase instance', function() {

      return fp.setPriority('test/firebase/set', 7)
      .then(function() {
        return expect(root.child('test/firebase/set'))
        .to.have.priority(7);
      });

    });

  });


  describe('setWithPriority', function() {

    it('sets values and priorities on the controller Firebase instance', function() {

      return fp.setWithPriority('test/firebase/set', 'baz', 9)
      .then(function() {
        return expect(root.child('test/firebase/set'))
        .to.equal('baz');
      })
      .then(function() {
        return expect(root.child('test/firebase/set'))
        .to.have.priority(9);
      });

    });

  });


  describe('update', function() {

    it('updates values on the controller Firebase instance', function() {

      var updateVal = {
        control: 'Smiley now'
      };

      return fp.update('test/firebase/value/properties', updateVal)
      .then(function() {

        return expect(root.child('test/firebase/value/properties'))
        .to.deep.equal({
          control: 'Smiley now',
          smiley: true,
          displayName: 'La Mer, as performed by Julio Iglesias'
        });

      });

    });

  });


  describe('remove', function() {

    it('removes values on the controller Firebase instance', function() {

      return fp.remove('test/firebase/set')
      .then(function() {
        return expect(root.child('test/firebase/set')).to.be.null;
      });

    });

  });

  describe('atomic operation', function() {

    beforeEach(inject(function(Fireproof) {

      Fireproof.setNextTick(function(fn) {
        setTimeout(function() {
          $rootScope.$apply(fn);
        }, 0);
      });

    }));

    describe('transaction', function() {

      it('performs the specified action atomically', function() {

        var xact = function(val) {
          if (val === null) {
            return '8';
          } else {
            return val + 'u';
          }
        };

        return Q.all([
          fp.transaction('test/firebase/xact', xact),
          fp.transaction('test/firebase/xact', xact),
          fp.transaction('test/firebase/xact', xact),
          fp.transaction('test/firebase/xact', xact)
        ])
        .then(function() {
          return expect(root.child('test/firebase/xact')).to.equal('8uuu');
        });

      });

    });

    describe('increment', function() {

      beforeEach(function() {

        return Q.all([
          fp.set('test/firebase/counter/numeric', 6),
          fp.set('test/firebase/counter/error', 'wut')
        ]);

      });

      it('atomically increments Firebase values', function() {

        return Q.all([
          fp.increment('test/firebase/counter/numeric'),
          fp.increment('test/firebase/counter/numeric'),
          fp.increment('test/firebase/counter/numeric')
        ])
        .then(function() {
          return expect(root.child('test/firebase/counter/numeric'))
          .to.equal(9);
        });

      });

      it('blows up if the location is non-numeric and non-null', function() {

        return fp.increment('test/firebase/counter/error')
        .then(function() {
          throw new Error('Expected an error, but the operation passed');
        }, function() {});

      });

    });


    describe('decrement', function() {

      beforeEach(function() {

        return Q.all([
          fp.set('test/firebase/counter/numeric', 6),
          fp.set('test/firebase/counter/error', 'wut')
        ]);

      });

      it('atomically decrements Firebase values', function() {

        return Q.all([
          fp.decrement('test/firebase/counter/numeric'),
          fp.decrement('test/firebase/counter/numeric'),
          fp.decrement('test/firebase/counter/numeric')
        ])
        .then(function() {
          return expect(root.child('test/firebase/counter/numeric'))
          .to.equal(3);
        });

      });

      it('blows up if the location is non-numeric and non-null', function() {

        return fp.decrement('test/firebase/counter/error')
        .then(function() {
          throw new Error('Expected an error, but the operation passed');
        }, function() {});

      });

    });

  });

});
