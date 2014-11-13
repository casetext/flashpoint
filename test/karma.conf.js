
module.exports = function(config) {

  'use strict';

  config.set({
    basePath: '..',
    frameworks: ['mocha', 'chai'],
    files: [
      { pattern: 'node_modules/angular/lib/angular.js', watched: false },
      { pattern: 'node_modules/angular-mocks/angular-mocks.js', watched: false },
      { pattern: 'node_modules/firebase/lib/firebase-web.js', watched: false },
      { pattern: 'node_modules/fireproof/dist/fireproof.js', watched: false },
      { pattern: 'node_modules/chai-fireproof/dist/chai-fireproof.js', watched: false },
      'dist/angular-fireproof.js',
      'test/mocks.js',
      'test/spec/**/*.js'
    ]
  });

};
