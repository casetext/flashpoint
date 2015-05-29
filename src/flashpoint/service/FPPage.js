
angular.module('flashpoint')
.factory('FPPage', function($q) {

  function FPPage(pagingFn) {

    this._pagingFn = pagingFn;
    this._pages = [];
    this._presence = {};

    this.items = [];

    this.keys = [];
    this.priorities = [];
    this.values = [];


    this.disconnect();

  }


  FPPage.prototype.connect = function(root) {

    this.disconnect();

    this.root = root;
    return this.next();

  };


  FPPage.prototype.disconnect = function() {

    this.root = null;
    this._pages.length = 0;

    this.items.length = 0;
    this.keys.length = 0;
    this.values.length = 0;
    this.priorities.length = 0;

    this.number = 0;
    this._presence = {};

  };


  FPPage.prototype._handleSnap = function(snap) {

    var newFPPage = [],
      presence = this._presence;

    snap.forEach(function(child) {

      if (!presence.hasOwnProperty(child.key()) ) {

        presence[child.key()] = true;
        newFPPage.push(child);

      }

    });

    if (newFPPage.length > 0) {
      this._pages.push(newFPPage);
      this._setFPPage(this._pages.length);
    } else {
      this._lastFPPage = this.number;
    }

    this._currentOperation = null;

  };


  FPPage.prototype.next = function() {

    if (!this.hasNext()) {

      // nothing to set.
      return $q.when();

    } else if (this._pages.length > this.number) {

      // we already have the page, just copy its contents into this.items
      this._setFPPage(this.number+1);
      return $q.when();

    } else if (this._currentOperation) {
      return this._currentOperation;
    } else if (this._pages.length === 0) {

      this._currentOperation = this._pagingFn(this.root, null)
      .then(this._handleSnap.bind(this));

      return this._currentOperation;

    } else if (this._pages[this._pages.length-1].length > 0) {

      var lastFPPage = this._pages[this._pages.length-1];

      this._currentOperation = this._pagingFn(this.root, lastFPPage[lastFPPage.length-1])
      .then(this._handleSnap.bind(this));

      return this._currentOperation;

    } else {
      return $q.when();
    }

  };


  FPPage.prototype.hasNext = function() {
    return this.hasOwnProperty('root') && this._lastFPPage !== this.number;
  };


  FPPage.prototype.hasPrevious = function() {
    return this.hasOwnProperty('root') && this.number > 1;
  };


  FPPage.prototype.previous = function() {

    if (this.hasPrevious()) {
      this._setFPPage(this.number-1);
    }

    return $q.when();

  };


  FPPage.prototype.reset = function() {
    return this.connect(this.root);
  };


  FPPage.prototype._setFPPage = function(pageNumber) {

    this.items.length = 0;
    this.keys.length = 0;
    this.values.length = 0;
    this.priorities.length = 0;

    this._pages[pageNumber-1].forEach(function(item) {

      this.items.push(item);
      this.keys.push(item.key());
      this.values.push(item.val());
      this.priorities.push(item.getPriority());

    }, this);

    this.number = pageNumber;

  };


  return FPPage;

});
