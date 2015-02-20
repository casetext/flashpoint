
angular.module('flashpoint')
.directive('onConnect', function() {

  /**
   * @ngdoc directive
   * @name onConnect
   * @description Evaluates the given expression on successfully establishing a Firebase connection.
   * Must be supplied together with `firebase`.
   *
   * The `onConnect` directive evaluates the expression you supply whenever the
   * connection to the Firebase is re-established.
   *
   * @restrict A
   * @element ANY
   */

  return {
    require: 'firebase',
    link: fpOnConnectLink
  };

});

function fpOnConnectLink(scope, el, attrs, fp) {

  var cancel;

  var attachListener = fp.onAttach(function() {

    cancel = scope.$watch('fp.connected', function(connected) {

      if (connected === true) {
        scope.$eval(attrs.onConnect);
      }

    });

  });

  var detachListener = fp.onDetach(function() {

    if (cancel) {
      cancel();
      cancel = null;
    }

  });

  scope.$on('$destroy', function() {

    fp.offAttach(attachListener);
    fp.offDetach(detachListener);

  });


}
