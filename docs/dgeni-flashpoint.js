
var path = require('path');

var Package = require('dgeni').Package;

module.exports = new Package('dgeni-flashpoint', [
  require('dgeni-packages/base'),
  require('dgeni-packages/ngdoc')
])
/*.processor(function sendToFirebaseProcessor() {

  return {

    $process: function(docs) {
      docs.forEach(function(doc) {
        console.log(doc.renderedContent);
      });
      return docs;
    },
    $runAfter: ['inlineTagProcessor']

  };
}) */
.config(function(log, readFilesProcessor, writeFilesProcessor, templateFinder, renderDocsProcessor) {

  templateFinder.templateFolders.unshift(__dirname + '/templates');
  // Set logging level
  log.level = 'info';

  renderDocsProcessor.extraData = {
    library: require('../package.json')
  };

  // Specify the base path used when resolving relative paths to source and output files
  readFilesProcessor.basePath = path.resolve(__dirname, '..');

  // Specify collections of source files that should contain the documentation to extract
  readFilesProcessor.sourceFiles = [
    {
      // Process all js files in `src` and its subfolders ...
      include: 'src/**/*.js',
      // When calculating the relative path to these files use this as the base path.
      // So `src/foo/bar.js` will have relative path of `foo/bar.js`
      basePath: 'src'
    }
  ];

  writeFilesProcessor.outputFolder = './dist/docs';
//  sendToFirebaseProcessor.firebaseUrl = 'https://test99999.firebaseio-demo.com';

});
