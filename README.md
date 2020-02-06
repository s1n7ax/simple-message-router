# simple-message-router

Simple Message Router is a message router which help you to organize `web sockets`, `chrome extension message passing` and more...There are similarities and dissimilarities between [ Router ](https://www.npmjs.com/package/router) and Simple Router. Just like router, simple-message-router supports middleware but this has nothing to do with HTTP so there are no request methods (GET, POST, PUT, DELETE).

Mechanism of this library is simple. Middleware will run always first on a request dispatch and then endpoint/endpoints. On an error in any middleware or endpoint, error handlers will take the control.

```
+----------------+
|                |
|  Middleware 1  |
|                |
+-------+--------+
        |
        |
        |            yes
 error? +--------------------------+------------------------------+
        |                          ^                              |
        |no                        |                              |
        v                          |                              v
+-------+--------+                 |              +---------------+---------------+
|                |                 |              |                               |
|  Middleware 2  |                 |              |        error handlers 1       |
|                |                 |              |                               |
+-------+--------+                 |              +---------------+---------------+
        |                          |                              |
        |            yes           |                              |
 error? +--------------------------+                              |
        |                          ^                              |
        |no                        |                              v
        v                          |              +---------------+---------------+
+-------+--------+                 |              |                               |
|                |                 |              |        error handlers 2       |
|    Endpoint    |                 |              |                               |
|                |                 |              +-------------------------------+
+-------+--------+                 |
        |                          |
 error? |            yes           |
        +--------------------------+
```

## API

Clear API name are really important IMO. So Following are the APIs, and what they do is pretty clear.

```js
var Router = require('simple-messaging-router');

var root = new Router();

root.registerMiddleware(function(req, res, next) {
    console.log('middleware');
});

root.registerEndpoint('/', function(req, res, next) {
    var data = doSomeStuff();
    console.log('endpoint');
    res(data);

    // just to invoke error handlers
    throw new Error();
});

root.registerErrorHandler('*', function(req, res, next, error) {
    console.log('error handlers::i got called because an error is thrown');
});

var request = {};
var response = function(data) {
    // implement the send response stuff here
};

root.dispatchRequest('/', request, response);
```

OUTPUT:

```
> middleware
> endpoint
> error handlers::i got called because an error is thrown
```

## Middleware

Middleware will provide a way to preprocess the requests before it goes through it's endpoint.

**Middleware will always run before the endpoint/endpoints. First to register, will run first when a request is dispatched**

**IF you didn't call next() within middleware, the request processing will never make to the endpoint**

```js
var Router = require('simple-messaging-router');

var root = new Router();

root.registerMiddleware(function(req, res, next) {
    console.log('middleware');
    next();
});

root.registerEndpoint('/', function(req, res, next) {
    console.log('endpoint');
});

root.dispatchRequest('/');
```

**output:**

```
> middleware
> endpoint
```

## Nested Routers

Yes, nested routers are possible!

```js
var Router = require('simple-messaging-router');

var root = new Router();
var user = new Router();

root.registerRouter('/user', user);

user.registerEndpoint('/', function(req, res, next) {
    var user = getUserDetails(req.data);
    console.log('user::root');
    res(user);
});

var request = {};
var response = function(data) {
    // implement the send response stuff here
};

root.dispatchRequest('/user', request, response);
```

**OUTPUT:**

```
> user::root
```

## Error Handling

There are two ways to throw an error within the router.

```js
var Router = require('simple-messaging-router');

var root = new Router();

root.registerErrorHandler('*', function(req, res, next, error) {
    console.log(error.message);
});

root.registerEndpoint('/throw', function() {
    throw new Error('throw');
});

root.registerEndpoint('/pass_to_next', function(req, res, next) {
    setTimeout(function() {
        next(new Error('pass_to_next'));
    }, 1000);
});

root.dispatchRequest('/throw');
root.dispatchRequest('/pass_to_next');
```

**OUTPUT:**

```
> throw
> pass_to_next
```

There are two ways to organize error handlers.

-   '\*' will run on any error (or simply any `next` call with an truthy argument)
-   '\<type>' will run on \<type> of errors

**Errors in nested routers will fallback until the root router unless it's being handled in between**

**So the way error handlers are identifying is the name of the error is the name property (error.name).**

```js
var Router = require('simple-messaging-router');

var root = new Router();

root.registerErrorHandler('*', function() {
    console.log('Any (*) Error');
});

root.registerErrorHandler('Error', function() {
    console.log('Error');
});

root.registerErrorHandler('TypeError', function() {
    console.log('TypeError');
});

root.registerEndpoint('/error', function() {
    throw new Error();
});

root.registerEndpoint('/typeError', function() {
    throw new TypeError();
});

root.dispatchRequest('/error');
console.log('-------------');
root.dispatchRequest('/typeError');
```

**OUTPUT:**

```
> Any (*) Error
> Error
> -------------
> Any (*) Error
> TypeError
```
