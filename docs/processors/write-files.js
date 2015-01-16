
var Q = require('q'),
  Fireproof = require('fireproof'),
  Firebase = require('firebase'),
  _ = require('lodash'),
  pkg = require('../../package.json'),
  name = keyify(pkg.name),
  version = keyify(pkg.version);

Fireproof.bless(Q);

function keyify(str) {
  return encodeURIComponent(str).replace(/\./g, '%2E');
}

module.exports = function writeFilesProcessor() {

  // this special writeFilesProcessor sends the docs to Firebase.

  return {

    $process: function(docs) {

      var root = new Fireproof(new Firebase(this.firebaseUrl));
      return root.authWithCustomToken(this.firebaseAuthSecret)
      .then(function() {

        // wipe out the existing docs
        return root.remove();
      })
      .then(function() {

        return Q.all(docs.map(function(doc) {

          var path = name + '/' + version + '/' + doc.objectContent.firebasePath;
          return root.child(path).set(_.omit(doc.objectContent, 'firebasePath'));

        }));

      })
      .then(function() {

        // generate the table of contents
        return Q.all(docs.map(function(doc) {

          var kind = doc.objectContent.ngdoc;
          switch(kind) {
          case 'type':
          case 'directive':
          case 'service':
          case 'object':
          case 'filter':
            return root.child(name)
            .child(version)
            .child('toc')
            .child(doc.module)
            .child(kind)
            .child(doc.objectContent.name)
            .set(true);
          default:
            return new Q();
          }

        }));

      })
      .then(function() {

        // generate the flat name lookup
        return Q.all(docs.map(function(doc) {

          return root.child(name)
          .child(version)
          .child('indexes/name->path')
          .child(keyify(doc.objectContent.name))
          .set(doc.objectContent.firebasePath);

        }));

      })
      .then(function() {
        return docs;
      });

    },
    $runAfter: ['writing-files'],
    $runBefore: ['files-written']

  };

};
