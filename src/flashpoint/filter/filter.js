
angular.module('flashpoint')
.filter('orderByKey', function() {

  return function(str) {

    if (!angular.isString(str)) {
      return null;
    } else {
      return str + '.orderByKey';
    }

  };

})
.filter('orderByValue', function() {

  return function(str) {

    if (!angular.isString(str)) {
      return null;
    } else {
      return str + '.orderByValue';
    }

  };

})
.filter('orderByPriority', function() {

  return function(str) {

    if (!angular.isString(str)) {
      return null;
    } else {
      return str + '.orderByPriority';
    }

  };

})
.filter('orderByChild', function() {


  return function(str, child) {

    if (!angular.isString(str) || !angular.isString(child) || child.length === 0) {
      return null;
    } else {
      return str + '.orderByChild:' + JSON.stringify(child);
    }

  };

})
.filter('startAt', function() {

  return function(str, startAt, startAtKey) {

    if (startAt === undefined) {
      return null;
    } else {
      str += '.startAt:' + JSON.stringify(startAt);
    }

    if (angular.isString(startAtKey) || angular.isNumber(startAtKey)) {
      return str + ':' + JSON.stringify(startAtKey);
    } else {
      return str;
    }

  };

})
.filter('endAt', function() {

  return function(str, endAt, endAtKey) {

    if (endAt === undefined) {
      return null;
    } else {
      str += '.endAt:' + JSON.stringify(endAt);
    }

    if (angular.isString(endAtKey) || angular.isNumber(endAtKey)) {
      return str + ':' + JSON.stringify(endAtKey);
    } else {
      return str;
    }

  };

})
.filter('limitToFirst', function() {

  return function(str, limitToFirst) {

    limitToFirst = parseInt(limitToFirst);

    if (isNaN(limitToFirst)) {
      return null;
    } else {
      return str + '.limitToFirst:' + JSON.stringify(limitToFirst);
    }

  };

})
.filter('limitToLast', function() {

  return function(str, limitToLast) {

    limitToLast = parseInt(limitToLast);

    if (isNaN(limitToLast)) {
      return null;
    } else {
      return str + '.limitToLast:' + JSON.stringify(limitToLast);
    }

  };

})
.constant('_fpGetRef', function(root, str) {

  if (str === null) {
    return null;
  } else {

    var params = str.split(/\./g),
      query = root.child(params.shift());

    return params.reduce(function(query, part) {

      var name = part.split(':')[0],
        args = part.split(':').slice(1).map(function(item) { return JSON.parse(item); });

      switch(name) {
      case 'orderByKey':
      case 'orderByValue':
      case 'orderByPriority':
        return query[name]();
      case 'orderByChild':
      case 'startAt':
      case 'endAt':
      case 'limitToFirst':
      case 'limitToLast':
        return query[name].apply(query, args);
      }

    }, query);

  }

});
