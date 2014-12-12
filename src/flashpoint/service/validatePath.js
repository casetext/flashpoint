
angular.module('flashpoint')
.factory('validatePath', function() {

  function validatePath(pathParts) {

    // check the arguments
    var path = pathParts.join('/');

    if (pathParts.length === 0 || path === '' ||
      pathParts.indexOf(null) !== -1 || pathParts.indexOf(undefined) !== -1) {

      // if any one of them is null/undefined, this is not a valid path
      return null;

    } else {
      return path;
    }

  }

  return validatePath;

});
