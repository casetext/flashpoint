angular-fireproof
=================

Angular bindings for Fireproof. Replaces AngularFire.

## Directives

All angular-fireproof directives generate new scope.

### `firebase`

Creates a Fireproof reference for the given Firebase URL and mounts a controller
with the following properties and methods:

- `root`: The root reference of the specified Firebase.
- `auth`: The auth data, if a user authentication event occurs.
- `profile`: User profile data, if a user authentication event occurs.
- `onProfile(cb)`: Notifies when changes to the user profile are discovered,
either because the underlying data has changed or because the user logged in
or out.
- `offProfile(cb)`: Detaches a listener previously attached with `onProfile(cb)`.
- `login(options)`: Triggers the login handler. Returns a promise that resolves on
successful login and rejects on unsuccessful login.

Attributes:

- `firebase`: Required. The full URL to your Firebase.
- `login-handler`: A handler that manages requests to log in and returns a promise
that resolves if authentication succeeds and rejects if authentication fails. It gets the special variable `$root` containing the Firebase snapshot, so you can
do things like `return $root.authWithCustomToken(...)`. It also receives a special
variable `$options` that contains any options that were passed to the
`login` in the first argument.
 NB: IF YOU DO NOT SUPPLY
THIS, ANY ATTEMPT TO USE AUTHENTICATION DIRECTIVES LIKE `auth-click` WILL FAIL!
- `profile-path`: The path to a place where user profile data is kept in the
Firebase, keyed under uid. So if a user is logged in as { uid: 'simplelogin:1' },
and `profile-path` is set to, say, "users", angular-fireproof will take the
value of `/users/simplelogin:1` and bind it to `$profile`.


Example:

```html
<div ng-app="myApp"
firebase="https://myfirebase.firebaseio.com"
login-handler="doLogin($root)"
profile-path="users"
>
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

- `link-to`: Also save the value of this property to another location in Firebase
anytime it gets synchronized. Useful for things like follower lists and other
denormalizations where you want the same value to be maintained in two places.

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

### authClick

Wraps click behavior in authentication, so you can do things like
```<button auth-click="deleteEverything()" auth-condition="$profile.super"></button>```

authClick's behavior is as follows:

- If the user is not logged in, the auth flow is started and any action is deferred
until the auth flow returns.

   - If the user fails or refuses to log in, ```on-auth-error``` is executed.

- If the user is logged in, ```auth-condition``` is evaluated. If it evaluates
to something truthy, then the expression in ```auth-click``` is executed.

Attributes:

- `auth-click`: The expression to execute if the user passes the test, e.g.
```<button auth-click="deleteOnlyOneThing()"></button>```.

- `auth-condition`: Specifies a custom authentication condition for the user. It provides the special variables `$auth`, containing the core Firebase
authentication data, and `$profile`, containing the user profile if one exists.E.g., ```<button auth-click="deleteAllTheThings()" auth-condition="$profile.super"></button>```.


### authIf

Places the element in the DOM if the authentication logic passes, so you can
do things like ```<div auth-if="$profile.super">SUPER SECRET MENU!!!!</div>```

Attributes:

- `auth-if`: If you supply an expression to `auth-if`, you can use custom logic
to decide if the element should exist. By default this
just checks to see that the user is logged in using some provider other than
anonymous, so you can do things like
`<div auth-if>NOT SO SECRET, ALL LOGGED IN USERS CAN SEE IT</div>`. It provides
the special variables `$auth`, containing the core Firebase authentication data,
and `$profile`, containing the user profile if one exists.


### authShow

Shows the element (using "display: none" shenanigans) if the authentication logic
passes, so you can do things like ```<div auth-show="$profile.super">YOU ARE A SUPER USER!</div>```

Attributes:

- `auth-show`: If you supply an expression to `auth-show`, you can use custom logic
to decide if the element should exist. By default this
just checks to see that the user is logged in using some provider other than
anonymous, so you can do things like
`<div auth-show>YOU ARE A PLAIN OLD LOGGED IN USER</div>`. It provides
the special variables `$auth`, containing the core Firebase authentication data,
and `$profile`, containing the user profile if one exists.
