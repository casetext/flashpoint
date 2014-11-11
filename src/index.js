
'use strict';

angular.module('angular-fireproof', [])
.run(function($q) {
  Fireproof.bless($q);
})
.factory('root', function(FIREBASE_URL) {
  return new Fireproof(new Firebase(FIREBASE_URL));
});



