
module.exports = function(config) {

  'use strict';

  config.set({
    basePath: '..',
    frameworks: ['mocha', 'sinon-chai'],
    files: [
      { pattern: 'bower_components/angular/angular.js', watched: false },
      { pattern: 'bower_components/angular-mocks/angular-mocks.js', watched: false },
      { pattern: 'node_modules/firebase/lib/firebase-web.js', watched: false },
      { pattern: 'node_modules/fireproof/dist/fireproof.js', watched: false },
      { pattern: 'node_modules/chai-fireproof/dist/chai-fireproof.js', watched: false },
      'dist/angular-fireproof.js',
      'test/mocks.js',
      'test/spec/**/*.js'
    ],
    preprocessors: {
      'test/spec/**/*.js': ['env']
    },
    envPreprocessor: [ 'FIREBASE_TEST_URL', 'FIREBASE_TEST_SECRET' ]
  });

};
