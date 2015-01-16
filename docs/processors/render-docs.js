
var _ = require('lodash');

module.exports = function renderDocsProcessor(log) {

  function stripObject(obj) {

    for (var key in obj) {
      if (obj[key] === undefined || obj[key] === null) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        stripObject(obj[key]);
      }
    }
  }

  // this special renderDocsProcessor renders documents into JSON objects.
  return {
    helpers: {},
    extraData: {},

    $runAfter: ['rendering-docs'],
    $runBefore: ['docs-rendered'],
    $validate: {
      helpers: {  },
      extraData: {  }
    },
    $process: function process(docs) {

      docs.forEach(function(doc) {

        doc.objectContent = {

          file: doc.fileInfo.projectRelativePath,
          firebasePath: doc.outputPath.replace(/[#$~.:]+/g, '/'),
          startingLine: doc.startingLine,
          endingLine: doc.endingLine,
          name: doc.name,
          shortDescription: doc.description.split(/\n\n/)[0],
          area: doc.area,
          id: doc.id || doc.name || doc.path

        };

        if (doc.tags && doc.tags.tagsByName) {

          Object.keys(doc.tags.tagsByName.obj)
          .forEach(function(tagName) {

            var newValue;
            switch(tagName) {

            case 'name':
            case 'description':
            case 'ngdoc':
            case 'module':
            case 'priority':
            case 'animations':
            case 'restrict':
            case 'methodOf':
            case 'propertyOf':
            case 'eventOf':
            case 'eventType':
            case 'element':
              newValue = doc.tags.tagsByName.obj[tagName][0].description;
              break;

            case 'see':
            case 'example':
              newValue = doc.tags.tagsByName.obj[tagName].map(function(tag) {
                return tag.description;
              });
              break;

            case 'scope':
              newValue = true;
              break;


            case 'returns':
            case 'return':
              var tag = doc.tags.tagsByName.obj[tagName][0];
              newValue = _.omit(tag, 'tagName', 'tagDef', 'alias', 'startingLine');
              break;

            default:
              newValue = doc.tags.tagsByName.obj[tagName].map(function(tag) {
                return _.omit(tag, 'tagName', 'tagDef', 'alias', 'startingLine');
              });
              break;

            }

            doc.objectContent[tagName] = newValue;

          }, {});

        }

        log.debug('Rendering doc:', doc.id || doc.name || doc.path);
        stripObject(doc.objectContent);
        doc.renderedContent = JSON.stringify(doc.objectContent, undefined, 2);

      }, this);

      return docs;

    }

  };

};
