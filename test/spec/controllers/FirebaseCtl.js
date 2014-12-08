

describe('FirebaseCtl', function() {

  var fp, $q, root;
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

    module('flashpoint.mocks');
    module('flashpoint');

    // generate the controller
    inject(function($rootScope, $controller, _$q_, Fireproof) {

      $q = _$q_;
      fp = $controller('FirebaseCtl', { $scope: $rootScope });
      fp.attachFirebase(window.__env__.FIREBASE_TEST_URL);
      root = new Fireproof(r);

      fp.setLoginHandler(function() {

        var deferred = $q.defer();

        root.authWithPassword({
          email: 'testy@testerson.com',
          password: '12345'
        }, function(err) {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve();
          }
        });

        return deferred.promise;

      });

    });

  });


  describe('val', function() {

    it('is a method to get Firebase values', function() {

      expect(fp.val).to.be.a('function');
      expect(fp.val('test/firebase/val')).to.equal(null);
      return root.child('test/firebase/val').set(1)
      .then(function() {
        expect(fp.val('test/firebase/val')).to.equal(1);
      });

    });

  });


  describe('set', function() {

    it('is a method to set Firebase values', function() {

      return fp.set('test/firebase/set', true).now()
      .then(function() {
        return expect(root.child('test/firebase/set')).to.be.true;
      });

    });

  });


  describe('setPriority', function() {

    it('is a method to set Firebase priorities', function() {

      return fp.setPriority('test/firebase/set', 7).now()
      .then(function() {
        return expect(root.child('test/firebase/set'))
        .to.have.priority(7);
      });

    });

  });


  describe('setWithPriority', function() {

    it('is a method to set Firebase values with priority', function() {

      return fp.setWithPriority('test/firebase/set', 'baz', 9).now()
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

    it('is a method to update Firebase values', function() {

      var updateVal = {
        control: 'Smiley now'
      };

      return fp.update('test/firebase/value/properties', updateVal).now()
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

    it('is a method to remove Firebase values', function() {

      return fp.remove('test/firebase/set').now()
      .then(function() {
        return expect(root.child('test/firebase/set')).to.be.null;
      });

    });

  });


  describe('increment', function() {

    beforeEach(function() {

      return $q.all([
        fp.set('test/firebase/counter/numeric', 6).now(),
        fp.set('test/firebase/counter/error', 'wut').now()
      ]);

    });

    it('atomically increments Firebase values', function() {

      return $q.all([
        fp.increment('test/firebase/counter/numeric').now(),
        fp.increment('test/firebase/counter/numeric').now(),
        fp.increment('test/firebase/counter/numeric').now()
      ])
      .then(function() {
        return expect(root.child('test/firebase/counter/numeric'))
        .to.equal(9);
      });

    });

    it('blows up if the location is non-numeric and non-null', function() {

      return fp.increment('test/firebase/counter/error').now()
      .then(function() {
        throw new Error('Expected an error, but the operation passed');
      }, function() {});

    });

  });


  describe('decrement', function() {

    beforeEach(function() {

      return $q.all([
        fp.set('test/firebase/counter/numeric', 6).now(),
        fp.set('test/firebase/counter/error', 'wut').now()
      ]);

    });

    it('atomically decrements Firebase values', function() {

      return $q.all([
        fp.decrement('test/firebase/counter/numeric').now(),
        fp.decrement('test/firebase/counter/numeric').now(),
        fp.decrement('test/firebase/counter/numeric').now()
      ])
      .then(function() {
        return expect(root.child('test/firebase/counter/numeric'))
        .to.equal(3);
      });

    });

    it('blows up if the location is non-numeric and non-null', function() {

      return fp.decrement('test/firebase/counter/error').now()
      .then(function() {
        throw new Error('Expected an error, but the operation passed');
      }, function() {});

    });

  });


});
