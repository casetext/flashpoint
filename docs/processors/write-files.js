
var Q = require('q'),
  Fireproof = require('fireproof'),
  Firebase = require('firebase'),
  _ = require('lodash');

Fireproof.bless(Q);

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

          var path = doc.objectContent.firebasePath;
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
            return root.child('toc')
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
        return docs;
      });

    },
    $runAfter: ['writing-files'],
    $runBefore: ['files-written']

  };

};
