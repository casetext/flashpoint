
angular.module('flashpoint')
.directive('fpBindChildren', function($animate, $compile, _fpGetRef) {

  /**
   * @ngdoc directive
   * @name fpBindChildren
   * @description Binds DOM elements to the children of a Firebase path.
   *
   * @restrict A
   * @element ANY
   * @param {expression} fpBindChildren The annotated path to the children to use.
   * @param {expression} query An expression that evaluates to a Firebase query.
   */

  function fpBindChildrenCompile($templateEl) {

    // search the template for fp-child-repeat, that's what we'll repeat on each child
    var template = $templateEl[0].querySelector('[fp-child-repeat]'),
      placeholder = angular.element(document.createElement('fp-child-repeat-placeholder'));

    if (template) {

      template = angular.element(template);
      template.after(placeholder);
      template.remove();

    } else {
      throw new Error('No fp-child-repeat was found in your fp-bind-children!');
    }

    return function fpBindChildrenLink(scope, el, attrs, fp) {

      var startPlaceholder = angular.element(document.createComment('fp-child-repeat start')),
        endPlaceholder = angular.element(document.createComment('fp-child-repeat end')),
        oldPlaceholder = el.find('fp-child-repeat-placeholder');

      oldPlaceholder.after(endPlaceholder);
      oldPlaceholder.after(startPlaceholder);
      oldPlaceholder.remove();

      var query,
        els = {},
        cancelAttachListener;

      scope.$children = [];


      function find(key) {

        // FIXME(goldibex): yes, I know this is linear time
        for (var i = 0; i < scope.$children.length; i++) {

          if (scope.$children[i].key() === key) {
            return i;
          }

        }

        return -1;

      }


      function _attach() {

        if (cancelAttachListener) {
          cancelAttachListener();
        }

        cancelAttachListener = scope.$watch(attrs.fpBindChildren, function(newQueryStr) {

          _detach();

          if (newQueryStr) {

            try {

              query = _fpGetRef(fp.root, newQueryStr);

              query.on('child_added', onAdded, onError);
              query.on('child_removed', onRemoved, onError);
              query.on('child_moved', onMoved, onError);
              query.on('child_changed', onChanged, onError);

            } catch(e) {
              onError(e);
            }

          }

        });

      }


      function _detach() {

        $animate.removeClass(el, 'fp-bind-children-error');

        if (query) {

          query.off('child_added', onAdded);
          query.off('child_removed', onRemoved);
          query.off('child_moved', onMoved);
          query.off('child_changed', onChanged);

        }

        query = null;

        scope.$children.forEach(function(child) {

          var deadEl = els[child.key()];
          deadEl.remove();

        });

        scope.$children.length = 0;

      }

      function onAdded(snap, prevKey) {

        var position = find(prevKey)+1;
        scope.$children.splice(position, 0, snap);

        var clone = template.clone(),
          cloneScope = scope.$new(),
          cloneFn = $compile(clone);

        // make sure the children know about flashpoint
        cloneFn(cloneScope, null, {
          transcludeControllers: {
            firebase: { instance: fp }
          }
        });

        var previousSibling = els[prevKey] || startPlaceholder;

        cloneScope.$key = snap.key();
        cloneScope.$value = snap.val();
        cloneScope.$priority = snap.getPriority();
        cloneScope.$index = position;

        els[snap.key()] = clone;

        $animate.enter(clone, el.parent(), previousSibling);

      }

      function onRemoved(snap) {

        $animate.leave(els[snap.key()]);

        var position = find(snap.key());
        scope.$children.splice(position, 1);

        $animate.leave(els[snap.key()], el.parent())
        .then(function() {
          els[snap.key()] = null;
        });

      }

      function onMoved(snap, prevKey) {

        var oldPosition = find(snap.key());
        scope.$children.splice(oldPosition, 1);

        var newPosition = find(prevKey) + 1;
        scope.$children.splice(newPosition, 0, snap);

        els[snap.key()].scope().$key = snap.key();
        els[snap.key()].scope().$value = snap.val();
        els[snap.key()].scope().$priority = snap.getPriority();
        els[snap.key()].scope().$index = newPosition+1;

        $animate.move(els[snap.key()], el.parent(), els[prevKey]);

      }

      function onChanged(snap) {

        var position = find(snap.key());
        scope.$children.splice(position, 1, snap);

        els[snap.key()].scope().$key = snap.key();
        els[snap.key()].scope().$value = snap.val();
        els[snap.key()].scope().$priority = snap.getPriority();

        $animate.addClass(els[snap.key()], 'fp-bind-children-changed')
        .then(function() {
          $animate.removeClass(els[snap.key()], 'fp-bind-children-changed');
        });

      }

      function onError(err) {

        scope.$error = err;
        $animate.addClass(el, 'fp-bind-children-error');

      }

      var onAttachListener = fp.onAttach(_attach);
      var onDetachListener = fp.onDetach(function() {

        if (cancelAttachListener) {
          cancelAttachListener();
          cancelAttachListener = null;
        }

        _detach();

      });

      scope.$on('$destroy', function() {

        // remove the comment nodes
        startPlaceholder.remove();
        endPlaceholder.remove();
        if (cancelAttachListener) {
          cancelAttachListener();
        }
        _detach();

        fp.offAttach(onAttachListener);
        fp.offDetach(onDetachListener);

      });

    };

  }

  return {
    restrict: 'A',
    priority: 900,
    require: '^firebase',
    compile: fpBindChildrenCompile
  };

});
