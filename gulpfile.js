
'use strict';

var rmdir = require('rimraf'),
  gulp = require('gulp-help')(require('gulp')),
  rename = require('gulp-rename'),
  concat = require('gulp-concat'),
  bump = require('gulp-bump'),
  wrap = require('gulp-wrap'),
  jsdoc2md = require('gulp-jsdoc-to-markdown'),
  filter = require('gulp-filter'),
  git = require('gulp-git'),
  tagVersion = require('gulp-tag-version'),
  version = require('./package.json').version,
  gutil = require('gulp-util'),
  karma = require('karma').server;


function npmPublish(done) {

  return function() {

    var spawn = require('child_process').spawn;

    spawn('npm', ['publish'], { stdio: 'inherit' })
    .on('error', done)
    .on('close', done);

  };

}

function inc(importance, done) {

  return gulp.src(['./package.json'])
  .pipe(bump({type: importance}))
  .pipe(gulp.dest('./'))
  .pipe(git.commit('new release'))
  .pipe(filter('package.json'))
  .pipe(tagVersion())
  .on('end', function() {

    git.push('origin', 'master', function(err) {
      if (err) {
        throw err;
      }
      npmPublish(done);
    });

  });

}


gulp.task('clean', 'Remove all build files', function(done) {
  rmdir('./dist', done);
});


gulp.task('build', 'Builds the Javascript for distribution.', ['clean'], function() {

  return gulp.src('src/**/*.js')
  .pipe(concat('angular-fireproof.js'))
  .pipe(wrap({ src: 'umd.template' }, { version: version }))
  .pipe(gulp.dest('./dist'));

});


gulp.task('docs', 'Generates a new version of the docs.', ['build'], function() {

  return gulp.src(['dist/angular-fireproof.js'])
  .pipe(jsdoc2md())
  .pipe(rename(function(path) {
    path.basename = 'api';
    path.extname = '.md';
  }))
  .pipe(gulp.dest('./'));

});

gulp.task('test', 'Runs tests once and exits.', function(done) {

  karma.start({
    singleRun: true,
    browsers: ['Firefox'],
    configFile: __dirname + '/test/karma.conf.js'
  }, done);

});

gulp.task('watch', 'Runs tests as you develop!', ['build'], function() {

  gulp.watch('src/**/*.js', ['build']);

  karma.start({
    autoWatch: true,
    browsers: ['Firefox'],
    configFile: __dirname + '/test/karma.conf.js'
  });

});


var bumpDeps = ['test'];

gulp.task('bump', 'Publishes a new bugfix version.', bumpDeps, function(done) {
  inc('patch', done);
});


gulp.task('bump:minor', 'Publishes a new minor version.', bumpDeps, function(done) {
  inc('minor', done);
});


gulp.task('bump:major', 'Publishes a new major version.', bumpDeps, function(done) {
  inc('major', done);
});

