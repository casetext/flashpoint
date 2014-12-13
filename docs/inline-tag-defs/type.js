
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

module.exports = function typeInlineTagDef() {

  return {
    name: 'type',
    handler: function(doc, tagName, tagDescription) {

      tagDescription = tagDescription
      .replace(/^Array\./, '')
      .replace(/^\*$/, 'any');

      var href;

      // is this a builtin type?
      var capitalizedType = tagDescription[0].toUpperCase() + tagDescription.slice(1);
      if (builtinTypes.indexOf(capitalizedType) !== -1) {
        // if so, its href is the Mozilla URL
        href = builtinAPIUrl + capitalizedType;
      } else {
        href = '/api/' + this.library.name + '/type/' + tagDescription;
      }

      return '[' + encoder.htmlEncode(tagDescription) + '](' + href + ')';

    }
  };

};
