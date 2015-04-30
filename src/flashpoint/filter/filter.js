
angular.module('flashpoint')
.filter('orderByKey', function() {

  return function orderByKey(path) {

    if (angular.isArray(path)) {
      return path.map(orderByKey);
    } else if (angular.isString(path)) {
      return path + '.orderByKey';
    } else {
      return null;
    }

  };

})
.filter('orderByValue', function() {

  return function orderByValue(path) {

    if (angular.isArray(path)) {
      return path.map(orderByValue);
    } else if (angular.isString(path)) {
      return path + '.orderByValue';
    } else {
      return null;
    }

  };

})
.filter('orderByPriority', function() {

  return function orderByPriority(path) {

    if (angular.isArray(path)) {
      return path.map(orderByPriority);
    } else if (angular.isString(path)) {
      return path + '.orderByPriority';
    } else {
      return null;
    }

  };

})
.filter('orderByChild', function() {


  return function orderByChild(path, child) {

    if (angular.isArray(path)) {
      return path.map(function(pathItem) {
        return orderByChild(pathItem, child);
      });
    } else if (angular.isString(path) && angular.isString(child) && child.length > 0) {
      return path + '.orderByChild:' + JSON.stringify(child);
    } else {
      return null;
    }

  };

})
.filter('startAt', function() {

  return function startAt(path, startAtValue, startAtKey) {

    if (angular.isArray(path)) {

      return path.map(function(pathItem) {
        return startAt(pathItem, startAtValue, startAtKey);
      });

    } else {

      if (startAtValue === undefined) {
        return null;
      } else {
        path += '.startAt:' + JSON.stringify(startAtValue);
      }

      if (angular.isString(startAtKey) || angular.isNumber(startAtKey)) {
        return path + ':' + JSON.stringify(startAtKey);
      } else {
        return path;
      }

    }

  };

})
.filter('endAt', function() {

  return function endAt(path, endAtValue, endAtKey) {

    if (angular.isArray(path)) {
      return path.map(function(pathItem) {
        return endAt(pathItem, endAtValue, endAtKey);
      });
    } else {

      if (endAtValue === undefined) {
        return null;
      } else {
        path += '.endAt:' + JSON.stringify(endAtValue);
      }

      if (angular.isString(endAtKey) || angular.isNumber(endAtKey)) {
        return path + ':' + JSON.stringify(endAtKey);
      } else {
        return path;
      }

    }

  };

})
.filter('limitToFirst', function() {

  return function limitToFirst(path, limitToFirstQuantity) {

    limitToFirstQuantity = parseInt(limitToFirstQuantity);

    if (isNaN(limitToFirstQuantity)) {
      return null;
    } else if (angular.isArray(path)) {

      return path.map(function(pathItem) {
        return limitToFirst(pathItem, limitToFirstQuantity);
      });

    } else {
      return path + '.limitToFirst:' + JSON.stringify(limitToFirstQuantity);
    }

  };

})
.filter('limitToLast', function() {

  return function limitToLast(path, limitToLastQuantity) {

    limitToLastQuantity = parseInt(limitToLastQuantity);

    if (isNaN(limitToLastQuantity)) {
      return null;
    } else if (angular.isArray(path)) {

      return path.map(function(pathItem) {
        return limitToLast(pathItem, limitToLastQuantity);
      });

    } else {
      return path + '.limitToLast:' + JSON.stringify(limitToLastQuantity);
    }

  };

})
.constant('_fpGetRef', function _fpGetRef(root, path) {

  if (angular.isArray(path)) {

    return path.map(function(pathItem) {
      return _fpGetRef(root, pathItem);
    });

  } else if (angular.isString(path)) {

    var params = path.split(/\./g),
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

  } else {
    return null;
  }

});
