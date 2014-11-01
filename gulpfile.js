
'use strict';

var rmdir = require('rimraf'),
  gulp = require('gulp-help')(require('gulp')),
  wrap = require('gulp-wrap'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  ngAnnotate = require('gulp-ng-annotate'),
  karma = require('karma').server;


gulp.task('clean', 'Remove all build files', function(done) {
  rmdir('./dist', done);
});


gulp.task('build:full', 'Builds the Javascript for distribution.', function() {

  return gulp.src('./src/**/*.js')
  .pipe(concat('angular-fireproof.js'))
  .pipe(wrap( { src: 'src/umd.template' } ))
  .pipe(gulp.dest('./dist'));

});


gulp.task('build:min', 'Minifies the Javascript for distribution.', function() {

  return gulp.src('./src/**/*.js')
  .pipe(concat('angular-fireproof.min.js'))
  .pipe(wrap( { src: 'src/umd.template' } ))
  .pipe(ngAnnotate())
  .pipe(uglify({ preserveComments: 'some' }))
  .pipe(gulp.dest('./dist'));

});


gulp.task('build', 'Builds distribution.', ['build:full', 'build:min']);


gulp.task('test', 'Runs tests once and exits.', function(done) {

  karma.start({
    configFile: __dirname + '/test/karma.conf.js',
    browsers: ['Chrome'],
    singleRun: true
  }, done);

});

gulp.task('watch', 'Runs tests as you develop.', function(done) {

  karma.start({
    configFile: __dirname + '/test/karma.conf.js'
  }, done);

});
