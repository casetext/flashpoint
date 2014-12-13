
module.exports = function writeFilesProcessor() {

  // this special writeFilesProcessor sends the docs to Firebase.

  return {

    $process: function(docs) {
      docs.forEach(function(doc) {
        console.log(doc.renderedContent);
      });
      return docs;
    },
    $runAfter: ['writing-files'],
    $runBefore: ['files-written']

  };

};