
module.exports = function(config) {

  'use strict';

  config.set({
    basePath: '..',
    frameworks: ['mocha', 'sinon-chai'],
    files: [
      { pattern: 'bower_components/angular/angular.js', watched: false },
      { pattern: 'bower_components/angular-route/angular-route.js', watched: false },
      { pattern: 'bower_components/angular-mocks/angular-mocks.js', watched: false },
      { pattern: 'bower_components/q/q.js', watched: false },
      { pattern: 'bower_components/firebase/firebase-debug.js', watched: false },
      { pattern: 'bower_components/fireproof/dist/fireproof.js', watched: false },
      { pattern: 'node_modules/chai-fireproof/dist/chai-fireproof.js', watched: false },
      'src/flashpoint/index.js',
      'src/flashpoint/**/*.js',
      'test/mocks.js',
      'test/spec/directive/fpBindChildren.js'
    ],
    browserNoActivityTimeout: 30000,
    preprocessors: {
      'test/spec/**/*.js': ['env']
    },
    envPreprocessor: [ 'FIREBASE_TEST_URL', 'FIREBASE_TEST_SECRET' ]
  });

};
