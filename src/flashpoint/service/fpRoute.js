
angular.module('flashpoint')
.constant('_fpFirebaseUrl', null)
.constant('_fpOnLoaded', null)
.constant('_fpOnError', null)
.constant('fpRoute', function(routeDefinitionObject) {

  routeDefinitionObject.resolve = routeDefinitionObject.resolve || {};
  routeDefinitionObject.controller = 'FirebaseCtl';
  if (!routeDefinitionObject.firebase) {
    throw new Error('No Firebase URL has been defined in your controller. ' +
      'Please set the "firebase" property in your route definition object.');
  }

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

  routeDefinitionObject.resolve._fpFirebaseUrl = function($q, $injector, Firebase, Fireproof) {

    var root = new Fireproof(new Firebase(firebaseUrl));

    return $q.when()
    .then(function() {

      if (routeDefinitionObject.challenge && root.getAuth() === null) {

        // the "challenge" function is injectable
        return $injector.invoke(routeDefinitionObject.challenge, null, {
          root: root
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

})
.directive('ngView', function() {

  return {
    restrict: 'ECA',
    priority: 1000,
    link: { pre: function(scope, el) {
      el.data('$firebaseController', el.data('$ngControllerController'));
    }}

  };

});
