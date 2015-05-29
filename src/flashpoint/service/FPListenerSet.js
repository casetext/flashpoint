
angular.module('flashpoint')
.factory('FPListenerSet', function() {

  function FPListenerSet(root, scope) {

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

      var newWatchers = {};

      for (var path in self.watchers) {

        if (self.watchers[path] && self.liveWatchers[path]) {
          newWatchers[path] = self.watchers[path];
        } else {
          self.remove(path);
        }

      }

      // as of now, nothing is alive.
      self.watchers = newWatchers;
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

  FPListenerSet.prototype.add = function(path) {

    var self = this;

    self.liveWatchers[path] = true;

    if (!self.watchers[path]) {

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

  };


  FPListenerSet.prototype.has = function(path) {
    return this.watchers.hasOwnProperty(path);
  };


  FPListenerSet.prototype.remove = function(path) {

    if (this.watchers[path]) {

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

    }

  };


  FPListenerSet.prototype.clear = function() {

    for (var path in this.watchers) {
      this.remove(path);
    }

    this.watchers = {};

  };

  return FPListenerSet;

});
