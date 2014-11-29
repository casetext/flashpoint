
var path = require('path');

var Package = require('dgeni').Package,
  pkg = require('../package.json');

var encoder = new require('node-html-encoder').Encoder();

var builtinAPIUrl =
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript' +
  '/Reference/Global_Objects/';

var builtinTypes = [
  'Array',
  'ArrayBuffer',
  'Boolean',
  'DataView',
  'Date',
  'Error',
  'EvalError',
  'Float32Array',
  'Float64Array',
  'Function',
  'Generator',
  'Infinity',
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'InternalError',
  'Intl',
  'Intl.Collator',
  'Intl.DateTimeFormat',
  'Intl.NumberFormat',
  'Iterator',
  'JSON',
  'Map',
  'Math',
  'NaN',
  'Number',
  'Object',
  'ParallelArray',
  'Promise',
  'Proxy',
  'RangeError',
  'ReferenceError',
  'RegExp',
  'Set',
  'String',
  'Symbol',
  'SyntaxError',
  'TypeError',
  'TypedArray',
  'URIError',
  'Uint8Array',
  'Uint8ClampedArray',
  'Uint16Array',
  'Uint32Array',
  'WeakMap',
  'WeakSet'
];

module.exports = new Package('dgeni-flashpoint', [
  require('dgeni-packages/ngdoc')
])
/*
.processor(function writeFilesProcessor() {

  // this special writeFilesProcessor sends the docs to Firebase.

  return {

    $process: function(docs) {
      console.log('HA HA!');
      return docs;
    },
    $runAfter: ['writing-files'],
    $runBefore: ['files-written']

  };

})
*/
.factory(function typeInlineTagDef(getTypeClass) {
  return {
    name: 'type',
    handler: function(doc, tagName, tagDescription) {

      tagDescription = tagDescription
      .replace(/^Array\./, '')
      .replace(/^\*$/, 'any');

      var href, target;

      // is this a builtin type?
      var capitalizedType = tagDescription[0].toUpperCase() + tagDescription.slice(1);
      if (builtinTypes.indexOf(capitalizedType) !== -1) {
        // if so, its href is the Mozilla URL
        href = builtinAPIUrl + capitalizedType;
        target = '_blank';
      } else {
        href = '/api/' + pkg.name + '/type/' + tagDescription;
        target = '_self';
      }

      return '<a href="' + href + '" ' +
      'target="' + target + '" ' +
      'class="' + getTypeClass(tagDescription) +
      '" >' + encoder.htmlEncode(tagDescription) + '</a>';

    }
  };
})
.config(function(inlineTagProcessor, typeInlineTagDef) {
  inlineTagProcessor.inlineTagDefinitions.push(typeInlineTagDef);
})
.config(function(log, readFilesProcessor, writeFilesProcessor, templateFinder, renderDocsProcessor) {

  templateFinder.templateFolders.unshift(__dirname + '/templates');
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

  writeFilesProcessor.outputFolder = './dist/docs';
//  sendToFirebaseProcessor.firebaseUrl = 'https://test99999.firebaseio-demo.com';

})
.config(function(computePathsProcessor) {

  computePathsProcessor.pathTemplates.push({
    docTypes: ['provider', 'service', 'directive', 'input', 'object', 'function', 'filter', 'type' ],
    pathTemplate: '/${area}/${module}/${docType}/${name}',
    outputPathTemplate: '${area}/${module}/${docType}/${name}.html'
  });
  computePathsProcessor.pathTemplates.push({
    docTypes: ['module' ],
    pathTemplate: '/${area}/${name}',
    outputPathTemplate: '${area}/${name}/index.html'
  });
  computePathsProcessor.pathTemplates.push({
    docTypes: ['componentGroup' ],
    pathTemplate: '/${area}/${moduleName}/${groupType}',
    outputPathTemplate: '${area}/${moduleName}/${groupType}/index.html'
  });

});
