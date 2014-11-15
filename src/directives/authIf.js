
angular.module('angular-fireproof.directives.authIf', [
  'angular-fireproof.directives.firebase'
])
.directive('authIf', function($animate) {

  return {

    restrict: 'A',
    transclude: 'element',
    scope: true,
    priority: 600,
    terminal: true,
    require: '^firebase',

    link: function(scope, el, attrs, firebase, transclude) {

      var block, childScope, previousElements;

      firebase.onProfile(profileListener);

      function profileListener() {

        var authOK;
        if (attrs.authIf) {

          authOK = scope.$eval(attrs.authIf, {
            $auth: firebase.auth,
            $profile: firebase.profile
          });

        } else {

          // by default, we check to see if the user is authed at all.
          authOK = angular.isDefined(firebase.$auth) &&
            firebase.$auth !== null &&
            firebase.$auth.provider !== 'anonymous';

        }

        if (authOK) {

          if (!childScope) {

            childScope = scope.$new();
            transclude(childScope, function (clone) {

              clone[clone.length++] = document.createComment(' end authIf: ' + attrs.authIf + ' ');
              // Note: We only need the first/last node of the cloned nodes.
              // However, we need to keep the reference to the jqlite wrapper as it might be changed later
              // by a directive with templateUrl when its template arrives.
              block = {
                clone: clone
              };

              $animate.enter(clone, el.parent(), el);

            });

          }

        } else {

          if (previousElements) {
            previousElements.remove();
            previousElements = null;
          }
          if (childScope) {
            childScope.$destroy();
            childScope = null;
          }
          if (block) {

            previousElements = (function getBlockNodes(nodes) {
              var node = nodes[0];
              var endNode = nodes[nodes.length - 1];
              var blockNodes = [node];

              do {
                node = node.nextSibling;
                if (!node) {
                  break;
                }
                blockNodes.push(node);
              } while (node !== endNode);

              return angular.element(blockNodes);
            })(block.clone);

            $animate.leave(previousElements, function() {
              previousElements = null;
            });

            block = null;

          }

        }

      }

      scope.$on('$destroy', function() {
        firebase.offProfile(profileListener);
      });

    }

  };

});
