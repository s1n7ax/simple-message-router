var assert = require('assert');
var Router = require('../');

describe('Router', function() {
    var router;

    var responseObj = {
        send: function() {}
    };

    beforeEach(function() {
        router = new Router();
    });

    describe('dispatchRequest()', function() {
        // ------ middleware calling order
        it('should call all the middleware before endpoint', function() {
            var dispatchOrder = [];

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware 1');
                next();
            });

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware 2');
                next();
            });

            router.registerEndpoint('/path', function(_req, res, _next) {
                dispatchOrder.push('endpoint');
                res.send('endpoint');
            });

            router.dispatchRequest('/path', {}, responseObj);

            assert.deepEqual(dispatchOrder, [
                'middleware 1',
                'middleware 2',
                'endpoint'
            ]);
        });

        it('should continue request processing even after middleware sent the response', function() {
            var dispatchOrder = [];

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware 1');
                next();
            });

            router.registerMiddleware(function(_req, res, next) {
                dispatchOrder.push('middleware 2');
                res.send('middleware 2');
                next();
            });

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware 3');
                next();
            });

            router.registerEndpoint('/path', function(_req, res, _next) {
                dispatchOrder.push('endpoint');
                res.send('endpoint');
            });

            router.dispatchRequest('/path', {}, responseObj);

            assert.deepEqual(dispatchOrder, [
                'middleware 1',
                'middleware 2',
                'middleware 3',
                'endpoint'
            ]);
        });

        it('should continue request processing even after endpoint sent the response', function() {
            var dispatchOrder = [];

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware');
                next();
            });

            router.registerEndpoint('/user', function(_req, res, next) {
                dispatchOrder.push('user 1');
                res.send();
                next();
            });

            router.registerEndpoint('/user', function(_req, _res, next) {
                dispatchOrder.push('user 2');
                next();
            });

            router.dispatchRequest('/user', {}, responseObj);

            assert.deepEqual(dispatchOrder, ['middleware', 'user 1', 'user 2']);
        });

        it('should terminate request processing if middleware did not call next()', function() {
            var dispatchOrder = [];

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware 1');
                next();
            });

            // this middleware is not calling next so the request processing should stop here
            router.registerMiddleware(function(_req, _res, _next) {
                dispatchOrder.push('middleware 2');
            });

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware 3');
                next();
            });

            router.registerEndpoint('/path', function(_req, res, _next) {
                dispatchOrder.push('endpoint');
                res.send('endpoint');
            });

            router.dispatchRequest('/path', {}, responseObj);

            assert.deepEqual(dispatchOrder, ['middleware 1', 'middleware 2']);
        });

        // ------ endpoint termination
        it('should terminate request processing if endpoint did not call next()', function() {
            var dispatchOrder = [];

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware');
                next();
            });

            router.registerEndpoint('/user', function(_req, _res, next) {
                dispatchOrder.push('user 1');
            });

            router.registerEndpoint('/user', function(_req, _res, next) {
                dispatchOrder.push('user 2');
                next();
            });

            router.dispatchRequest('/user', {}, responseObj);

            assert.deepEqual(dispatchOrder, ['middleware', 'user 1']);
        });

        // ------ middleware only routers
        it('should support middleware only routers', function() {
            var dispatchOrder = [];

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware 1');
                next();
            });
            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware 2');
                next();
            });
            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware 3');
                next();
            });
            router.registerMiddleware(function(_req, res, next) {
                dispatchOrder.push('middleware 4');
                next();
            });
            router.dispatchRequest('/', {}, responseObj);

            assert.deepEqual(dispatchOrder, [
                'middleware 1',
                'middleware 2',
                'middleware 3',
                'middleware 4'
            ]);
        });

        // ------ endpoint only routers
        it('should support endpoint only routers', function() {
            var dispatchOrder = [];

            router.registerEndpoint('/user', function(_req, _res, next) {
                dispatchOrder.push('user');
                next();
            });

            router.registerEndpoint('/banking', function(_req, _res, next) {
                dispatchOrder.push('banking');
                next();
            });

            router.registerEndpoint('/loans', function(_req, _res, next) {
                dispatchOrder.push('loans');
                next();
            });

            router.registerEndpoint('/employee', function(_req, _res, next) {
                dispatchOrder.push('employee');
                next();
            });

            router.dispatchRequest('/user', {}, responseObj);
            router.dispatchRequest('/banking', {}, responseObj);
            router.dispatchRequest('/loans', {}, responseObj);
            router.dispatchRequest('/employee', {}, responseObj);

            assert.deepEqual(dispatchOrder, [
                'user',
                'banking',
                'loans',
                'employee'
            ]);
        });

        // ------ request & response data passing
        it('should pass the request & response correctly', function() {
            var responseData;

            var request = {
                name: 'srinesh'
            };

            var response = function(data) {
                responseData = data;
            };

            var middleware1 = function(req, res, next) {
                assert.equal(req, request);
                assert.equal(res, response);
                next();
            };

            var middleware2 = function(req, res, next) {
                assert.equal(req, request);
                assert.equal(res, response);
                res({ name: 'welcome ' + req.name });
                next();
            };

            var middleware3 = function(req, res, next) {
                assert.equal(req, request);
                assert.equal(res, response);
                next();
            };

            router.registerMiddleware(middleware1);
            router.registerMiddleware(middleware2);
            router.registerMiddleware(middleware3);
            router.dispatchRequest('/', request, response);

            assert.deepEqual(responseData, { name: 'welcome ' + request.name });
        });

        it('should not be mandatory to pass request and response parameters when dispatching ', function() {
            var dispatchOrder = [];

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware 1');
                next();
            });

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware 2');
                next();
            });

            router.registerEndpoint('/path', function(_res, _res, next) {
                dispatchOrder.push('path 1');
                next();
            });

            router.registerEndpoint('/path', function(_res, _res, next) {
                dispatchOrder.push('path 2');
                next();
            });

            router.dispatchRequest('/path');

            assert.deepEqual(dispatchOrder, [
                'middleware 1',
                'middleware 2',
                'path 1',
                'path 2'
            ]);
        });

        // ------ selecting correct endpoint
        it('should select the correct endpoint from similar first level endpoints', function() {
            var dispatchOrder = [];

            router.registerEndpoint('/', function(_req, _res, next) {
                dispatchOrder.push('root');
                next();
            });

            router.registerEndpoint('/user', function(_req, _res, next) {
                dispatchOrder.push('user');
                next();
            });

            router.registerEndpoint('/user/details', function(
                _req,
                _res,
                next
            ) {
                dispatchOrder.push('user details');
                next();
            });

            router.dispatchRequest('/user');
            assert.deepEqual(dispatchOrder, ['user']);

            router.dispatchRequest('/user/details');
            assert.deepEqual(dispatchOrder, ['user', 'user details']);
        });

        // ------ dispatch middleware in order when nested routers
        it('should run middleware in order when nested routers are present', function() {
            var dispatchOrder = [];
            var response = '';

            // root  router middleware
            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('root::middleware1');
                next();
            });

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('root::middleware2');
                next();
            });

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('root::middleware3');
                next();
            });

            // user middleware
            var user = new Router();

            user.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('user::middleware1');
                next();
            });

            user.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('user::middleware2');
                next();
            });

            user.registerMiddleware(function(_req, res, _next) {
                dispatchOrder.push('user::middleware3');
                res.send('user::endpoint');
            });

            router.registerRouter('/user', user);

            router.dispatchRequest(
                '/user',
                {},
                {
                    send: function(data) {
                        response = data;
                    }
                }
            );

            // validation
            assert.deepEqual(dispatchOrder, [
                'root::middleware1',
                'root::middleware2',
                'root::middleware3',
                'user::middleware1',
                'user::middleware2',
                'user::middleware3'
            ]);
            assert.equal(response, 'user::endpoint');
        });

        it('should run endpoints in nested routers', function() {
            var dispatchOrder = [];

            // root  router endpoints
            router.registerEndpoint('/', function(_req, _res, next) {
                dispatchOrder.push('root::root');
                next();
            });

            router.registerEndpoint('/banking', function(_req, res, _next) {
                dispatchOrder.push('root::banking');
                res.send('root::banking');
            });

            // user endpoints
            var user = new Router();

            user.registerEndpoint('/', function() {
                dispatchOrder.push('user::root');
                next();
            });

            user.registerEndpoint('/details', function(_req, res, _next) {
                dispatchOrder.push('user::details');
                res.send('user::details');
            });

            user.registerEndpoint('/banking', function(_req, res, _next) {
                dispatchOrder.push('user::banking');
                res.send('user::banking');
            });

            router.registerRouter('/user', user);

            router.dispatchRequest('/user/details', undefined, responseObj);
            assert.deepEqual(dispatchOrder, ['user::details']);

            router.dispatchRequest('/banking', undefined, responseObj);
            assert.deepEqual(dispatchOrder, ['user::details', 'root::banking']);

            router.dispatchRequest('/', undefined, responseObj);
            assert.deepEqual(dispatchOrder, [
                'user::details',
                'root::banking',
                'root::root'
            ]);
        });

        it('should stop request processing and call error handlers on an error from middleware', function() {
            var router = new Router();
            var dispatchOrder = [];

            router.registerErrorHandler('*', function(req, res, next, error) {
                dispatchOrder.push('error');
                assert.equal(error.name, 'Error');
                assert.equal(error.message, 'middleware2');
            });

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware1');
                next();
            });

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware2');
                throw new Error('middleware2');
            });

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware3');
                next();
            });

            router.registerEndpoint('/user', function(_req, _res, next) {
                dispatchOrder.push('user');
                next();
            });

            router.dispatchRequest('/user', {}, responseObj);
            assert.deepEqual(dispatchOrder, [
                'middleware1',
                'middleware2',
                'error'
            ]);
        });

        it('should stop request processing and call error handlers on an error from endpoint', function() {
            var dispatchOrder = [];

            router.registerErrorHandler('*', function(
                _req,
                _res,
                _next,
                error
            ) {
                dispatchOrder.push('error');
                assert.equal(error.name, 'Error');
                assert.equal(error.message, 'user');
            });

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware');
                next();
            });

            router.registerEndpoint('/user', function(_req, _res, _next) {
                dispatchOrder.push('user1');
                throw new Error('user');
            });

            router.registerEndpoint('/user', function(_req, _res, next) {
                dispatchOrder.push('user2');
            });

            router.dispatchRequest('/user');

            assert.deepEqual(dispatchOrder, ['middleware', 'user1', 'error']);
        });

        it('should stop request processing and call error handlers on an error passed to next() call', function() {
            var dispatchOrder = [];

            router.registerErrorHandler('*', function(
                _req,
                _res,
                _next,
                error
            ) {
                dispatchOrder.push('error');
                assert.equal(error.name, 'Error');
                assert.equal(error.message, 'user');
            });

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware');
                next();
            });

            router.registerEndpoint('/user', function(_req, _res, next) {
                dispatchOrder.push('user1');
                next(new Error('user'));
            });

            router.registerEndpoint('/user', function(_req, _res, _next) {
                dispatchOrder.push('user2');
            });

            router.dispatchRequest('/user');

            assert.deepEqual(dispatchOrder, ['middleware', 'user1', 'error']);
        });

        it('should throw the error if an error thrown from error handlers', function() {
            router.registerErrorHandler('*', function(
                _req,
                _res,
                _next,
                _error
            ) {
                throw new Error('error handlers');
            });

            router.registerMiddleware(function(_req, _res) {
                throw new Error('middleware');
            });

            assert.throws(function() {
                router.dispatchRequest('/');
            });
        });

        it('should pass the error to next error handlers on an error', function() {
            var dispatchOrder = [];

            router.registerErrorHandler('*', function(
                _req,
                _res,
                next,
                _error
            ) {
                dispatchOrder.push('error handlers 1');
                next(new TypeError());
            });

            router.registerErrorHandler('*', function(
                _req,
                _res,
                _next,
                _error
            ) {
                dispatchOrder.push('error handlers 2');
            });

            router.registerMiddleware(function(_req, _res) {
                dispatchOrder.push('middleware');
                throw new Error('middleware');
            });

            router.dispatchRequest('/');
            assert.deepEqual(dispatchOrder, [
                'middleware',
                'error handlers 1',
                'error handlers 2'
            ]);
        });

        it('should pass the error to correct error handler', function() {
            var dispatchOrder = [];

            router.registerErrorHandler('*', function(_req, _res, next, error) {
                dispatchOrder.push('Any 1');
                next();
            });

            router.registerErrorHandler('*', function(
                _req,
                _res,
                next,
                _error
            ) {
                dispatchOrder.push('Any 2');
                next();
            });

            router.registerErrorHandler('TypeError', function(
                _req,
                _res,
                next,
                _error
            ) {
                dispatchOrder.push('TypeError');
            });

            router.registerErrorHandler('Error', function(
                _req,
                _res,
                next,
                _error
            ) {
                dispatchOrder.push('Error');
            });

            router.registerEndpoint('/typeError', function(_req, _res, _next) {
                throw new TypeError();
            });

            router.registerEndpoint('/error', function(_req, _res, _next) {
                throw new Error();
            });

            router.dispatchRequest('/typeError');
            assert.deepEqual(dispatchOrder, ['Any 1', 'Any 2', 'TypeError']);
            dispatchOrder = [];

            router.dispatchRequest('/error');
            assert.deepEqual(dispatchOrder, ['Any 1', 'Any 2', 'Error']);
        });

        it('should pass unhandled errors in nested router until the root router', function() {
            var root = new Router();
            var nested1 = new Router();
            var nested2 = new Router();
            var dispatchOrder = [];

            root.registerErrorHandler('*', function() {
                dispatchOrder.push('root::errorHandler');
            });

            nested2.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('nested2::middleware');
                next();
            });

            nested2.registerEndpoint('/', function() {
                dispatchOrder.push('nested2::endpoint');
                throw new Error();
            });

            nested1.registerRouter('/', nested2);
            root.registerRouter('/nested', nested1);
            root.dispatchRequest('/nested');

            assert.deepEqual(dispatchOrder, [
                'nested2::middleware',
                'nested2::endpoint',
                'root::errorHandler'
            ]);
        });
    });

    describe('registerMiddleware()', function() {
        it('should throw on not function parameter', function() {
            assert.throws(function() {
                router.registerMiddleware({});
            });

            assert.throws(function() {
                router.registerMiddleware(true);
            });
            assert.throws(function() {
                router.registerMiddleware('');
            });
        });

        it('should register middleware successfully', function() {
            var middleware1 = function(_req, _res, _next) {};
            var middleware2 = function(_req, _res, _next) {};
            var middleware3 = function(_req, _res, _next) {};
            router.registerMiddleware(middleware1);
            router.registerMiddleware(middleware2);
            router.registerMiddleware(middleware3);

            assert.equal(router.middleware[0], middleware1);
            assert.equal(router.middleware[1], middleware2);
            assert.equal(router.middleware[2], middleware3);
        });
    });
});
