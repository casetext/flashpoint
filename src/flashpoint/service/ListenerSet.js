
angular.module('flashpoint')
.factory('ListenerSet', function() {

  function ListenerSet(root, scope) {

    var self = this,
      scrubbingListeners = false;

    self.watchers = {};
    self.liveWatchers = {};
    self.values = {};
    self.priorities = {};
    self.errors = {};

    self.root = root;
    self.scope = scope;

    function scrubListeners() {

      for (var path in self.watchers) {

        if (self.watchers[path] && !self.liveWatchers[path]) {
          self.remove(path);
        }

      }

      // as of now, nothing is alive.
      self.liveWatchers = {};
      scrubbingListeners = false;

    }

    self.scope.$watch(function() {

      // after each scope cycle, sweep out any "orphaned" listeners, i.e.,
      // ones we previously connected but don't need anymore.

      if (!scrubbingListeners) {

        scrubbingListeners = true;

        scope.$$postDigest(scrubListeners);

      }

    });

  }

  ListenerSet.prototype.add = function(path, watcher) {

    var self = this;

    self.liveWatchers[path] = true;

    if (!self.watchers[path]) {

      if (watcher) {
        self.watchers[path] = watcher;
      } else {

        self.watchers[path] = self.root.child(path)
        .on('value', function(snap) {

          self.errors[path] = null;
          self.values[path] = snap.val();
          self.priorities[path] = snap.getPriority();
          self.scope.$evalAsync();

        }, function(err) {

          self.liveWatchers[path] = false;
          self.watchers[path] = null;
          self.errors[path] = err;
          self.values[path] = null;
          self.priorities[path] = null;
          self.scope.$evalAsync();

        });

      }

    }

  };


  ListenerSet.prototype.has = function(path) {
    return this.watchers.hasOwnProperty(path);
  };


  ListenerSet.prototype.remove = function(path) {

    // disconnect this watcher, it doesn't exist anymore.
    if (this.watchers[path].disconnect) {
      this.watchers[path].disconnect();
    } else {
      this.root.child(path).off('value', this.watchers[path]);
    }

    // clear all values associated with the watcher
    this.values[path] = null;
    this.errors[path] = null;
    this.priorities[path] = null;
    this.watchers[path] = null;

  };


  ListenerSet.prototype.clear = function() {

    for (var path in this.watchers) {
      this.remove(path);
    }

  };

  return ListenerSet;

});
