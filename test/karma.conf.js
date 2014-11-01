
module.exports = function(config) {

  'use strict';

  config.set({
    basePath: '..',
    frameworks: ['mocha', 'chai', 'commonjs'],
    files: [
      { pattern: 'node_modules/angular/lib/angular.js', watched: false },
      { pattern: 'node_modules/angular-mocks/angular-mocks.js', watched: false },
      { pattern: 'node_modules/firebase/lib/firebase-web.js', watched: false },
      { pattern: 'node_modules/fireproof/index.js', watched: false },
      'src/**/*.js',
      'test/spec/**/*.js'
    ],
    preprocessors: {
      'node_modules/fireproof/index.js': 'commonjs'
    }
  });

};
