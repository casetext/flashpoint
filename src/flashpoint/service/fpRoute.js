
angular.module('flashpoint')
.constant('_fpFirebaseUrl', null)
.constant('_fpOnLoaded', null)
.constant('_fpOnError', null)
.constant('_fpHandleLogin', null)
.constant('_fpHandleLogout', null)
.constant('fpRoute', function(routeDefinitionObject) {

  if (!routeDefinitionObject.firebase) {
    throw new Error('No Firebase URL has been defined in your controller. ' +
      'Please set the "firebase" property in your route definition object.');
  }

  routeDefinitionObject.resolve = routeDefinitionObject.resolve || {};

  var firebaseUrl = routeDefinitionObject.firebase;
  delete routeDefinitionObject.firebase;


  if (routeDefinitionObject.loaded) {

    var onLoaded = routeDefinitionObject.loaded;
    delete routeDefinitionObject.loaded;

    routeDefinitionObject.resolve._fpOnLoaded = function() {
      return onLoaded;
    };

  }

  if (routeDefinitionObject.error) {

    var onError = routeDefinitionObject.error;
    delete routeDefinitionObject.error;

    routeDefinitionObject.resolve._fpOnError = function() {
      return onError;
    };

  }

  if (routeDefinitionObject.login) {

    var login = routeDefinitionObject.login;

    routeDefinitionObject.resolve._fpHandleLogin = function() {
      return login;
    };

  }

  if (routeDefinitionObject.logout) {

    var logout = routeDefinitionObject.logout;
    delete routeDefinitionObject.logout;

    routeDefinitionObject.resolve._fpHandleLogout = function() {
      return logout;
    };

  }


  routeDefinitionObject.resolve._fpFirebaseUrl = function($q, $injector, Firebase, Fireproof) {

    var root = new Fireproof(new Firebase(firebaseUrl));

    return $q.when()
    .then(function() {

      if (routeDefinitionObject.challenge &&
        routeDefinitionObject.login &&
        root.getAuth() === null) {

        // the "login" function is injectable
        return $injector.invoke(routeDefinitionObject.login, null, {
          root: root,
          auth: null
        });

      }

    })
    .then(function() {

      if (routeDefinitionObject.authorize) {

        // the "authorize" function is injectable
        return $injector.invoke(routeDefinitionObject.authorize, null, {
          root: root,
          auth: root.getAuth()
        });

      }

    })
    .then(function() {
      return firebaseUrl;
    });

  };

  routeDefinitionObject.resolve._fpFirebaseUrl.$inject =
    ['$q', '$injector', 'Firebase', 'Fireproof'];

  return routeDefinitionObject;

});
