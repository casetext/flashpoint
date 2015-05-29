
angular.module('flashpoint')
.factory('FPFeed', function($q) {

  function FPFeed(paths, queryFn) {

    if (arguments.length < 2) {
      throw new Error('FPFeed expects at least 2 arguments, got ' + arguments.length);
    }

    if (!angular.isArray(paths)) {
      paths = [paths];
    }


    this._queryFn = queryFn;

    this._positions = paths.reduce(function(obj, path) {

      obj[path] = undefined;
      return obj;

    }, {});
    this._presence = {};
    this.items = [];

  }

  FPFeed.prototype._transformFn = function(obj) {
    return obj;
  };

  FPFeed.prototype._filterFn = function() {
    return true;
  };

  FPFeed.prototype.setTransform = function(fn) {
    this._transformFn = fn;
    return this;
  };

  FPFeed.prototype.setSort = function(fn) {
    this._sortFn = fn;
    return this;
  };

  FPFeed.prototype.setFilter = function(fn) {
    this._filterFn = fn;
    return this;
  };

  FPFeed.prototype.more = function() {

    var self = this;

    if (!self._morePromise) {

      self._morePromise = $q.all(Object.keys(self._positions).map(function(path) {

        return self._queryFn(self.root.child(path), self._positions[path])
        .then(function(snap) {

          var promises = [];
          snap.forEach(function(feedEntry) {

            if (!self._presence.hasOwnProperty(feedEntry.ref().toString())) {

              self._presence[feedEntry.ref().toString()] = true;
              promises.push($q.when(self._transformFn(feedEntry, self.root)));
              self._positions[path] = feedEntry;

            }

          });

          return $q.all(promises);

        });

      }))
      .then(function(feedResultsArrays) {

        var allResults = feedResultsArrays
        .reduce(function(allResults, feedResultArray) {
          return allResults.concat(feedResultArray);
        }, [])
        .filter(function(object, index, array) {
          return self._filterFn(object, index, array, self.items);
        });

        if (self._sortFn) {
          allResults.sort(self._sortFn);
        }

        allResults.forEach(function(result) {
          self.items.push(result);
        });

        self._morePromise = null;

      });

    }

    return self._morePromise;

  };

  FPFeed.prototype.connect = function(root) {

    this.disconnect();
    this.root = root;
    return this.more();

  };

  FPFeed.prototype.disconnect = function() {

    this._positions = Object.keys(this._positions).reduce(function(obj, path) {

      obj[path] = undefined;
      return obj;

    }, {});
    this._presence = {};
    this.items.length = 0;

  };

  return FPFeed;

});
