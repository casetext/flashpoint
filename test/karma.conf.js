
module.exports = function(config) {

  'use strict';

  config.set({
    basePath: '..',
    frameworks: ['mocha', 'chai', 'commonjs'],
    files: [
      'index.js',
      'test/spec/core.js',
      { pattern: 'bower_components/**/*.js', watched: false, included: false },
      { pattern: 'node_modules/**/*.js', watched: false, included: false },
    ],
    preprocessors: {
      'index.js': ['commonjs']
    }
  });

};
