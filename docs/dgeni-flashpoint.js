
var path = require('path');

var Package = require('dgeni').Package,
  pkg = require('../package.json'),
  firebaseUrl = 'https://' + require('../firebase.json').firebase + '.firebaseio.com';

// prep to write docs to Firebase


module.exports = new Package('dgeni-flashpoint', [
  require('dgeni-packages/jsdoc'),
])

.factory(require('dgeni-packages/ngdoc/file-readers/ngdoc'))
.factory(require('dgeni-packages/ngdoc/services/getAliases'))
.factory(require('dgeni-packages/ngdoc/services/getDocFromAlias'))
.factory(require('dgeni-packages/ngdoc/services/getLinkInfo'))
.factory(require('dgeni-packages/ngdoc/services/getTypeClass'))
.factory(require('dgeni-packages/ngdoc/services/moduleMap'))
.config(function(readFilesProcessor, ngdocFileReader) {
  readFilesProcessor.fileReaders.push(ngdocFileReader);
})
.factory(require('./inline-tag-defs/link'))
.factory(require('./inline-tag-defs/type'))
.config(function(inlineTagProcessor, typeInlineTagDef, linkInlineTagDef) {
  typeInlineTagDef.library = pkg;
  inlineTagProcessor.inlineTagDefinitions.push(typeInlineTagDef);
  inlineTagProcessor.inlineTagDefinitions.push(linkInlineTagDef);
})
.processor(require('./processors/render-docs'))
.processor(require('./processors/write-files'))
.config(function(parseTagsProcessor, getInjectables) {
  parseTagsProcessor.tagDefinitions =
      parseTagsProcessor.tagDefinitions.concat(getInjectables(require('dgeni-packages/ngdoc/tag-defs')));
})

.config(function(log, readFilesProcessor, writeFilesProcessor, templateFinder, renderDocsProcessor) {

  // Set logging level
  log.level = 'info';

  renderDocsProcessor.extraData = {
    library: pkg
  };

  // Specify the base path used when resolving relative paths to source and output files
  readFilesProcessor.basePath = path.resolve(__dirname, '..');

  // Specify collections of source files that should contain the documentation to extract
  readFilesProcessor.sourceFiles = [
    { include: 'src/**/*.js', basePath: 'src' },
    { include: 'docs/content/**/*.ngdoc', basePath: 'docs/content' }
  ];

  writeFilesProcessor.firebaseUrl = firebaseUrl;
  writeFilesProcessor.firebaseAuthSecret = process.env.FLASHPOINT_AUTH_SECRET;

})
.config(function(computeIdsProcessor, createDocMessage, getAliases) {

  computeIdsProcessor.idTemplates.unshift({
    docTypes: ['module' ],
    idTemplate: 'module:${name}',
    getAliases: getAliases
  });

  computeIdsProcessor.idTemplates.unshift({
    docTypes: ['method', 'property', 'event'],
    getId: function(doc) {
      var parts = doc.name.split('#');
      var name = parts.pop();
      parts.push(doc.docType + ':' + name);
      return parts.join('#');
    },
    getAliases: function(doc) {
      var aliases = getAliases(doc);
      aliases.push(doc.name);
      return aliases;
    }
  });

  computeIdsProcessor.idTemplates.unshift({
    docTypes: ['provider', 'service', 'directive', 'input', 'object', 'function', 'filter', 'type' ],
    idTemplate: 'module:${module}.${docType}:${name}',
    getAliases: getAliases
  });


})
.config(function(computePathsProcessor) {

  computePathsProcessor.pathTemplates.push({
    docTypes: ['provider', 'service', 'directive', 'input', 'object', 'function', 'filter', 'type', 'method', 'property', 'event' ],
    pathTemplate: '/${area}/${module}/${docType}/${name}',
    outputPathTemplate: '${area}/${module}/${docType}/${name}'
  });
  computePathsProcessor.pathTemplates.push({
    docTypes: ['module'],
    pathTemplate: '/${area}/modules/${name}',
    outputPathTemplate: '${area}/modules/${name}'
  });

});
