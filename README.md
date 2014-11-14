angular-fireproof
=================

Angular bindings for Fireproof. Replaces AngularFire.

## Directives

All angular-fireproof directives generate new scope.

### `firebase`

Creates a Fireproof reference for the given Firebase URL and mounts the following
properties on `$scope`:

- `$scope.$fireproof`: The root reference of the specified Firebase.
- `$scope.$auth`: The auth data, if a user authentication event occurs.

Attributes:

- `firebase`: Required. The full URL to your Firebase.
- `on-auth`: A function to bind to the Firebase `onAuth` event.

Example:

```html
<div ng-app="myApp" firebase="https://myfirebase.firebaseio-demo.com">
...
</div>
```

### `fp-bind`

Binds scope to a given reference in the Firebase. Requires `firebase` to have
been used in a parent scope. The Firebase object will be available on scope
at the path specified in the `as` attribute. It also creates the following
functions on `$scope`:

- `$scope.$save()`: Save any local changes to the value to Firebase.
- `$scope.$revert()`: Revert the object to the most recent version from Firebase.

Attributes:

- `fp-bind`: Required. The path in your Firebase to bind to. This value is interpolated, so you can do things like `fp-bind="users/{{ userName }}"`.

- `as`: Required. The name of the scope property to create. So if you were to 
use `fp-bind="users/{{ userName }}" as="user"`, the user object would be accessible
as `$scope.user`.

- `watch`: Watch the Firebase location for changes and synchronize them to the
scope object. This way, any changes in Firebase will be reflected in your local
scope.

- `sync`: Watch the scope value for changes and synchronize them to Firebase. This way, any changes in your local scope will be reflected in Firebase. If you use
this property, `$scope.$save` and `$scope.$revert` become no-ops.

- `on-load`: Will be evaluated when a new value arrives from Firebase. It gets
the special variable `$snap` containing the Firebase snapshot, so you can do things
like `on-load=mySpecialHandler($snap)`.

- `on-save`: Will be evaluated when a value is saved to Firebase.

- `on-permission-denied`: Will be evaluated instead of `on-error` if it's set and
a permission error occurs trying to read or write to Firebase. It gets the special variable `$error` containing the error, so you can do things like
`on-permission-denied="showPrettyErrorBox($error)"`.

- `on-error`: Will be evaluated for other Firebase errors. It gets the special variable `$error` containing the error, so you can do things like
`on-error="showPrettyErrorBox($error)"`.

### `fp-page`

Pages through the child properties of a Firebase reference. Requires `firebase` to have been used in a parent scope. Its children will be available on scope at the
property specified in the `as` attribute. The page object will be an array with
two special properties, `$keys` and `$priorities`.

This directive also creates the following functions and properties on `$scope`:

- `$scope.$next()`: Get the next page of results into the scope object.
- `$scope.$previous()`: Get the previous page of results into the scope object.
- `$scope.$hasNext`: true if there's possibly another page of results available
by calling `$next`, false otherwise.
- `$scope.$hasPrevious`: true if there's possibly another page of results available
by calling `$previous`, false otherwise.

`$next` and `$previous` are also available as methods of the scope object itself
so that you can call them from child scopes. So you can do either `$scope.$next()`
or (`$scope.widgets.$next()`).

Attributes:

- `fp-page`: Required. The path to an object in your Firebase whose children
you want to page through. This value is interpolated, so you can do things like `fp-bind="{{ things }}"`.
- `as`: Required. The name of the scope property to create. So if you were to use
`fp-page="users" as="users"`, the user object would be accessible as `$scope.users`.
- `limit`: The maximum number of objects in each page. Defaults to 5.
- `start-at-priority`: The priority of the first child you want to page over.
- `start-at-name`: The name of the first child you want to page over. Only works
if `start-at-priority` is also set.
- `on-page`: Will be evaluated when a new value arrives from Firebase. It gets
the special variable `$snaps` containing an array of Firebase snapshots, so you
can do things like `on-page=mySpecialHandler($snaps)`.
- `on-error`: Will be evaluated for other Firebase errors. It gets the special variable `$error` containing the error, so you can do things like
`on-error="showPrettyErrorBox($error)"`.

Example:

```html
<ul fp-page="indexes/users/slug->id" as="users">
  <li ng-repeat="userId in users" fp-bind="users/{{ userId }}" as="user">
    <a ng-href="/users/{{ userId }}">{{ user.firstName + ' ' + user.lastName }}</a>
  </li>
</ul>
```
