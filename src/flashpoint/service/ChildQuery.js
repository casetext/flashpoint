
angular.module('flashpoint')
.factory('ChildQuery', function(validatePath) {

  /**
   * @ngdoc type
   * @name ChildQuery
   * @description A way to generate long Firebase queries inside an Angular expression.
   */
  function ChildQuery(root, watchers, liveWatchers) {

    this.root = root;
    this.watchers = watchers;
    this.liveWatchers = liveWatchers;
    this._props = {};

  }

  /**
   * @ngdoc method
   * @name ChildQuery#startAt
   * @description Invokes Fireproof#startAt.
   */
  ChildQuery.prototype.startAt = function(value, key) {

    this._props.startAtValue = value;
    if (key) {
      this._props.startAtKey = key;
    }

    return this;

  };

  /**
   * @ngdoc method
   * @name ChildQuery#endAt
   * @description Invokes Fireproof#endAt.
   */
  ChildQuery.prototype.endAt = function(value, key) {

    this._props.endAtValue = value;
    if (key) {
      this._props.endAtKey = key;
    }

    return this;

  };

  /**
   * @ngdoc method
   * @name ChildQuery#equalTo
   * @description Invokes Fireproof#equalTo.
   */
  ChildQuery.prototype.equalTo = function(value, key) {

    this._props.equalToValue = value;
    if (key) {
      this._props.equalToKey = key;
    }

    return this;

  };

  /**
   * @ngdoc method
   * @name ChildQuery#limitToFirst
   * @description Invokes Fireproof#limitToFirst.
   */
  ChildQuery.prototype.limitToFirst = function(limit) {

    this._props.limitToFirst = limit;
    return this;

  };

  /**
   * @ngdoc method
   * @name ChildQuery#limitToLast
   * @description Invokes Fireproof#limitToLast.
   */
  ChildQuery.prototype.limitToLast = function(limit) {

    this._props.limitToLast = limit;
    return this;

  };

  /**
   * @ngdoc method
   * @name ChildQuery#orderByKey
   * @description Invokes Fireproof#orderByKey.
   */
  ChildQuery.prototype.orderByKey = function() {

    this._props.orderBy = 'key';
    return this;

  };

  /**
   * @ngdoc method
   * @name ChildQuery#orderByPriority
   * @description Invokes Fireproof#orderByPriority.
   */
  ChildQuery.prototype.orderByPriority = function() {

    this._props.orderBy = 'priority';
    return this;

  };

  /**
   * @ngdoc method
   * @name ChildQuery#orderByChild
   * @description Invokes Fireproof#orderByChild.
   */
  ChildQuery.prototype.orderByChild = function(child) {

    this._props.orderBy = 'child';
    this._props.orderByChild = child;
    return this;

  };

  /**
   * @ngdoc method
   * @name ChildQuery#of
   * @description Specifies the path for the child query. NOTE: ALWAYS DO THIS LAST!
   * @param {...String} pathParams The path parameters for this query.
   */
  ChildQuery.prototype.of = function() {

    var args = Array.prototype.slice.call(arguments, 0),
      path = validatePath(args),
      ref = this.root.child(path),
      id = path + '.children';

    switch(this._props.orderBy || '') {
    case 'key':
      id += '.orderByKey';
      ref = ref.orderByKey();
      break;
    case 'priority':
      id += '.orderByPriority';
      ref = ref.orderByPriority();
      break;
    case 'child':
      id += '.orderByChild.' + this._props.orderByChild;
      ref = ref.orderByChild(this._props.orderByChild);
      break;
    }

    if (this._props.startAtValue && this._props.startAtKey) {
      id += '.startAtValue.' + this._props.startAtValue + '.startAtKey.' + this._props.startAtKey;
      ref = ref.startAt(this._props.startAtValue, this._props.startAtKey);
    } else if (this._props.startAtValue) {
      id += '.startAtValue.' + this._props.startAtValue;
      ref = ref.startAt(this._props.startAtValue);
    }

    if (this._props.endAtValue && this._props.endAtKey) {
      id += '.endAtValue.' + this._props.endAtValue + '.endAtKey.' + this._props.endAtKey;
      ref = ref.endAt(this._props.endAtValue, this._props.endAtKey);
    } else if (this._props.endAtValue) {
      id += '.endAtValue.' + this._props.endAtValue;
      ref = ref.endAt(this._props.endAtValue);
    }

    if (this._props.equalToValue && this._props.equalToKey) {
      id += '.equalToValue.' + this._props.equalToValue + '.equalToKey.' + this._props.equalToKey;
      ref = ref.equalTo(this._props.equalToValue, this._props.equalToKey);
    } else if (this._props.equalToValue) {
      id += '.equalToValue.' + this._props.equalToValue;
      ref = ref.equalTo(this._props.equalToValue);
    }

    if (this._props.limitToFirst) {
      id += '.limitToFirst.' + this._props.limitToFirst;
      ref = ref.limitToFirst(this._props.limitToFirst);
    }

    if (this._props.limitToLast) {
      id += '.limitToLast.' + this._props.limitToLast;
      ref = ref.limitToLast(this._props.limitToLast);
    }

    this.liveWatchers[id] = true;

    if (!this.watchers[id]) {

      this.watchers[id] = new Fireproof.LiveArray();
      if (this._props.orderBy === 'child') {
        this.watchers[id].connect(ref, this._props.orderBy, this._props.orderByChild);
      } else if (this._props.orderBy) {
        this.watchers[id].connect(ref, this._props.orderBy);
      } else {
        this.watchers[id].connect(ref);
      }

    }

    return this.watchers[id];

  };

  return ChildQuery;

});
