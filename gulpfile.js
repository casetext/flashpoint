
'use strict';

var rmdir = require('rimraf'),
  gulp = require('gulp-help')(require('gulp')),
  rename = require('gulp-rename'),
  concat = require('gulp-concat'),
  bump = require('gulp-bump'),
  annotate = require('gulp-ng-annotate'),
  uglify = require('gulp-uglify'),
  wrap = require('gulp-wrap'),
  Dgeni = require('dgeni'),
  filter = require('gulp-filter'),
  git = require('gulp-git'),
  tagVersion = require('gulp-tag-version'),
  pkg = require('./package.json'),
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

gulp.on('err', function(e) {
  console.log(e.err.stack);
});


gulp.task('clean', 'Remove all build files', function(done) {
  rmdir('./dist', done);
});


gulp.task('build', 'Builds the Javascript for distribution.', ['clean'], function() {

  return gulp.src('src/**/*.js')
  .pipe(concat('flashpoint.js'))
  .pipe(annotate())
  .pipe(wrap({ src: 'umd.template' }, { pkg: pkg, year: new Date().getFullYear() }))
  .pipe(gulp.dest('./dist'))
  .pipe(rename('flashpoint.min.js'))
  .pipe(uglify({preserveComments: 'some'}))
  .pipe(gulp.dest('./dist'));
});


gulp.task('docs', 'Generates a new version of the docs.', ['build'], function() {

  var dgeni = new Dgeni([require('./docs/dgeni-flashpoint')]);
  try {
  return dgeni.generate()
  .catch(function(e) {
    console.log(e.stack);
  });
  } catch(e) {
    console.log(e.stack);
  }

});

gulp.task('test', 'Runs tests once and exits.', ['build'], function(done) {

  if (!(process.env.FIREBASE_TEST_URL && process.env.FIREBASE_TEST_SECRET)) {
    done(new Error('You must supply FIREBASE_TEST_URL and FIREBASE_TEST_SECRET to run the tests'));
  } else {

    karma.start({
      singleRun: true,
      browsers: ['Firefox'],
      configFile: __dirname + '/test/karma.conf.js'
    }, done);

  }

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


gulp.task('demo', 'Run a demo server forever.', ['build'], function(done) {

  var express = require('express');
  var app = express();

  app.use('/bower_components', express.static(__dirname + '/bower_components'));
  app.use('/node_modules', express.static(__dirname + '/node_modules'));
  app.use('/demo', express.static(__dirname + '/test/demo'));
  app.get('/flashpoint.js', function(req, res) {
    res.sendFile(__dirname + '/dist/flashpoint.js');
  });
  app.get('/flashpoint.min.js', function(req, res) {
    res.sendFile(__dirname + '/dist/flashpoint.min.js');
  });
  app.get('/', function(req, res) {
    res.sendFile(__dirname + '/test/demo/index.html');
  });

  app.listen(3000);
  console.log('Demo server running on port 3000.');

});
