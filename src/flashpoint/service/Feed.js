
angular.module('flashpoint')
.factory('Feed', function($q) {

  function Feed(paths, queryFn) {

    if (arguments.length < 2) {
      throw new Error('Feed expects at least 2 arguments, got ' + arguments.length);
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

  Feed.prototype._transformFn = function(obj) {
    return obj;
  };

  Feed.prototype._filterFn = function() {
    return true;
  };

  Feed.prototype.setTransform = function(fn) {
    this._transformFn = fn;
    return this;
  };

  Feed.prototype.setSort = function(fn) {
    this._sortFn = fn;
    return this;
  };

  Feed.prototype.setFilter = function(fn) {
    this._filterFn = fn;
    return this;
  };

  Feed.prototype.more = function() {

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

  Feed.prototype.connect = function(root) {

    this.disconnect();
    this.root = root;
    return this.more();

  };

  Feed.prototype.disconnect = function() {

    this._positions = Object.keys(this._positions).reduce(function(obj, path) {

      obj[path] = undefined;
      return obj;

    }, {});
    this._presence = {};
    this.items.length = 0;

  };

  return Feed;

});
