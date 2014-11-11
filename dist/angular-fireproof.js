
(function (root, factory) {

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['angular'], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    factory(require('angular'), require('firebase'), require('fireproof'));
  } else {
    // Browser globals (root is window)
    factory(root.angular, root.firebase, root.fireproof);
  }

}(this, function (angular, firebase, fireproof) {

  'use strict';
    
  angular.module('angular-fireproof', [])
  .run(function($q) {
    Fireproof.bless($q);
  })
  .factory('root', function(FIREBASE_URL) {
    return new Fireproof(new Firebase(FIREBASE_URL));
  });
  
  
  
  

}));
