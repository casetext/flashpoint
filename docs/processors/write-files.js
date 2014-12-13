
var Q = require('q'),
  Fireproof = require('fireproof'),
  Firebase = require('firebase');

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
          delete doc.objectContent.firebasePath;
          return root.child(path).set(doc.objectContent);

        }));

      })
      .then(function() {

        // generate the indexes also

        return docs;

      });
    },
    $runAfter: ['writing-files'],
    $runBefore: ['files-written']

  };

};
