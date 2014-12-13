
var url = require('url');

module.exports = function linkInlineTagDef() {

  var aliasToPathLookup;

  return {
    name: 'link',
    handler: function(doc, tagName, tagDescription, docs) {

      if (!aliasToPathLookup) {

        aliasToPathLookup = docs.reduce(function(lookup, doc) {

          lookup[doc.id] = doc.path;
          doc.aliases.forEach(function(alias) {
            lookup[alias] = doc.path;
          });
          return lookup;

        }, {});

      }

      var possibleUrl = url.parse(tagDescription.split(/\s/)[0]);
      if (possibleUrl.protocol && possibleUrl.path) {

        // linkify in Markdown.
        return '[' +
          possibleUrl.toString() +
          '](' +
          tagDescription.split(/\s/).slice(1).join(' ') +
          ')';

      } else {

        return '[' +
          tagDescription +
          '](' +
          aliasToPathLookup[tagDescription] +
          ')';

      }

    }

  };

};
