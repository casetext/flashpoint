
angular.module('flashpoint')
.factory('Page', function($q) {

  function Page(pagingFn) {

    this._pagingFn = pagingFn;
    this._pages = [];
    this._presence = {};

    this.items = [];

    this.keys = [];
    this.priorities = [];
    this.values = [];


    this.disconnect();

  }


  Page.prototype.connect = function(root) {

    this.disconnect();

    this.root = root;
    return this.next();

  };


  Page.prototype.disconnect = function() {

    this.root = null;
    this._pages.length = 0;

    this.items.length = 0;
    this.keys.length = 0;
    this.values.length = 0;
    this.priorities.length = 0;

    this.number = 0;
    this._presence = {};

  };


  Page.prototype._handleSnap = function(snap) {

    var newPage = [],
      presence = this._presence;

    snap.forEach(function(child) {

      if (!presence.hasOwnProperty(child.key()) ) {

        presence[child.key()] = true;
        newPage.push(child);

      }

    });

    if (newPage.length > 0) {
      this._pages.push(newPage);
      this._setPage(this._pages.length);
    } else {
      this._lastPage = this.number;
    }

    this._currentOperation = null;

  };


  Page.prototype.next = function() {

    if (!this.hasNext()) {

      // nothing to set.
      return $q.when();

    } else if (this._pages.length > this.number) {

      // we already have the page, just copy its contents into this.items
      this._setPage(this.number+1);
      return $q.when();

    } else if (this._currentOperation) {
      return this._currentOperation;
    } else if (this._pages.length === 0) {

      this._currentOperation = this._pagingFn(this.root, null)
      .then(this._handleSnap.bind(this));

      return this._currentOperation;

    } else if (this._pages[this._pages.length-1].length > 0) {

      var lastPage = this._pages[this._pages.length-1];

      this._currentOperation = this._pagingFn(this.root, lastPage[lastPage.length-1])
      .then(this._handleSnap.bind(this));

      return this._currentOperation;

    } else {
      return $q.when();
    }

  };


  Page.prototype.hasNext = function() {
    return this.hasOwnProperty('root') && this._lastPage !== this.number;
  };


  Page.prototype.hasPrevious = function() {
    return this.hasOwnProperty('root') && this.number > 1;
  };


  Page.prototype.previous = function() {

    if (this.hasPrevious()) {
      this._setPage(this.number-1);
    }

    return $q.when();

  };


  Page.prototype.reset = function() {
    return this.connect(this.root);
  };


  Page.prototype._setPage = function(pageNumber) {

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


  return Page;

});
