var assert = require('assert');
var Router = require('../src/router');
var UnhandledRequestError = Router.UnhandledRequestError;

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
            var resultOrder = [];

            router.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('middleware 1');
                next();
            });

            router.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('middleware 2');
                next();
            });

            router.registerEndpoint('/user', function(_req, res, _next) {
                resultOrder.push('endpoint');
                res.send('endpoint::user');
            });

            router.dispatchRequest('/user', {}, responseObj);

            assert.deepEqual(resultOrder, [
                'middleware 1',
                'middleware 2',
                'endpoint'
            ]);
        });

        // ------ middleware termination
        it('should terminate request processing if middleware sent the response', function() {
            var resultOrder = [];

            router.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('middleware 1');
                next();
            });

            // this middleware is sending the response so the request processing should stop here
            router.registerMiddleware(function(_req, res, next) {
                resultOrder.push('middleware 2');
                res.send('response is sent');
                next();
            });

            router.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('middleware 3');
                next();
            });

            router.registerEndpoint('/user', function(_req, res, _next) {
                resultOrder.push('endpoint');
                res.send('endpoint::user');
            });

            router.dispatchRequest('/user', {}, responseObj);

            assert.deepEqual(resultOrder, ['middleware 1', 'middleware 2']);
        });

        it('should terminate request processing if middleware did not call next()', function() {
            var resultOrder = [];

            router.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('middleware 1');
                next();
            });

            // this middleware is not calling next so the request processing should stop here
            router.registerMiddleware(function(_req, _res, _next) {
                resultOrder.push('middleware 2');
            });

            router.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('middleware 3');
                next();
            });

            router.registerEndpoint('/user', function(_req, res, _next) {
                resultOrder.push('endpoint');
                res.send('endpoint::user');
            });

            router.dispatchRequest('/user', {}, responseObj);

            assert.deepEqual(resultOrder, ['middleware 1', 'middleware 2']);
        });

        // ------ endpoint termination
        it('should terminate request processing if endpoint sent the response', function() {
            var resultOrder = [];

            router.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('middleware');
                next();
            });

            router.registerEndpoint('/user', function(_req, _res, next) {
                resultOrder.push('user');
                next();
            });

            router.registerEndpoint('/user/banking', function(
                _req,
                _res,
                next
            ) {
                resultOrder.push('banking1');
                next();
            });

            // this endpoint is sending the response so the request processing should stop here
            router.registerEndpoint('/user/banking', function(_req, res, next) {
                resultOrder.push('banking2');
                res.send('endpoint::banking');
                next();
            });

            router.registerEndpoint('/user/banking', function(
                _req,
                res,
                _next
            ) {
                resultOrder.push('banking3');
                res.send('endpoint::banking');
            });

            router.registerEndpoint('/user/banking/loans', function(
                _req,
                res,
                _next
            ) {
                resultOrder.push('loans');
                res.send('endpoint::loans');
            });

            router.dispatchRequest('/user/banking', {}, responseObj);

            assert.deepEqual(resultOrder, [
                'middleware',
                'banking1',
                'banking2'
            ]);
        });

        it('should terminate request processing if endpoint did not call next()', function() {
            var resultOrder = [];

            router.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('middleware');
                next();
            });

            router.registerEndpoint('/user', function(_req, _res, next) {
                resultOrder.push('user');
                next();
            });

            router.registerEndpoint('/user/banking', function(
                _req,
                _res,
                next
            ) {
                resultOrder.push('banking1');
                next();
            });

            // this endpoint is not calling next() so the request processing should stop here
            router.registerEndpoint('/user/banking', function(
                _req,
                _res,
                _next
            ) {
                resultOrder.push('banking2');
            });

            router.registerEndpoint('/user/banking', function(
                _req,
                _res,
                _next
            ) {
                resultOrder.push('banking3');
            });

            router.registerEndpoint('/user/banking/loans', function(
                _req,
                res,
                _next
            ) {
                resultOrder.push('loans');
                res.send('loans');
            });

            router.registerEndpoint('/user/banking/loans', function(
                _req,
                res,
                _next
            ) {
                resultOrder.push('loans');
                res.send('loans');
            });

            router.dispatchRequest('/user/banking', {}, responseObj);

            assert.deepEqual(resultOrder, [
                'middleware',
                'banking1',
                'banking2'
            ]);
        });

        // ------ middleware only routers
        it('should support middleware only routers', function() {
            var resultOrder = [];

            router.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('middleware1');
                next();
            });
            router.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('middleware2');
                next();
            });
            router.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('middleware3');
                next();
            });
            router.registerMiddleware(function(_req, res, _next) {
                resultOrder.push('middleware4');
                res.send('send response');
            });
            router.dispatchRequest('/', {}, responseObj);

            assert.deepEqual(resultOrder, [
                'middleware1',
                'middleware2',
                'middleware3',
                'middleware4'
            ]);
        });

        // ------ endpoint only routers
        it('should support endpoint only routers', function() {
            var resultOrder = [];

            router.registerEndpoint('/user', function(_req, _res, next) {
                resultOrder.push('user');
                next();
            });

            router.registerEndpoint('/banking', function(_req, _res, next) {
                resultOrder.push('banking');
                next();
            });

            router.registerEndpoint('/loans', function(_req, _res, next) {
                resultOrder.push('loans');
                next();
            });

            router.registerEndpoint('/employee', function(_req, _res, next) {
                resultOrder.push('employee');
                next();
            });

            router.dispatchRequest('/user', {}, responseObj);
            router.dispatchRequest('/banking', {}, responseObj);
            router.dispatchRequest('/loans', {}, responseObj);
            router.dispatchRequest('/employee', {}, responseObj);

            assert.deepEqual(resultOrder, [
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

            var response = {
                send: function(data) {
                    responseData = data;
                }
            };

            var middleware1 = function(req, res, next) {
                assert.equal(req, request);
                assert.equal(res, response);
                next();
            };

            var middleware2 = function(req, res, next) {
                assert.equal(req, request);
                assert.equal(res, response);
                next();
            };

            var middleware3 = function(req, res, _next) {
                assert.equal(req, request);
                assert.equal(res, response);
                res.send({ name: 'welcome ' + req.name });
            };

            router.registerMiddleware(middleware1);
            router.registerMiddleware(middleware2);
            router.registerMiddleware(middleware3);
            router.dispatchRequest('/', request, response);

            assert.deepEqual(responseData, { name: 'welcome ' + request.name });
        });

        // ------ selecting correct endpoint
        it('should select the correct endpoint from similar first level endpoints', function() {
            var dispatchOrder = [];

            var response = {
                send: function(data) {
                    responseData = data;
                }
            };

            var middleware1 = function(_req, _res, next) {
                dispatchOrder.push('middleware1');
                next();
            };

            var middleware2 = function(_req, _res, next) {
                dispatchOrder.push('middleware2');
                next();
            };

            var endpointUser = function(_req, res, _next) {
                dispatchOrder.push('user');
                res.send();
            };

            var endpointUserDetails = function(_req, res, _next) {
                dispatchOrder.push('user details');
                res.send();
            };

            router.registerMiddleware(middleware1);
            router.registerMiddleware(middleware2);
            router.registerEndpoint('/user', endpointUser);
            router.registerEndpoint('/user/details', endpointUserDetails);

            router.dispatchRequest('/user/details', {}, response);
            assert.deepEqual(dispatchOrder, [
                'middleware1',
                'middleware2',
                'user details'
            ]);

            dispatchOrder = [];
            router.dispatchRequest('/user', {}, response);
            assert.deepEqual(dispatchOrder, [
                'middleware1',
                'middleware2',
                'user'
            ]);
        });

        // ------ dispatch middleware in order when nested routers
        it('should run middleware in order when nested routers are present', function() {
            var resultOrder = [];
            var response = '';

            // root  router middleware
            router.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('root::middleware1');
                next();
            });

            router.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('root::middleware2');
                next();
            });

            router.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('root::middleware3');
                next();
            });

            // user middleware
            var user = new Router();

            user.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('user::middleware1');
                next();
            });

            user.registerMiddleware(function(_req, _res, next) {
                resultOrder.push('user::middleware2');
                next();
            });

            user.registerMiddleware(function(_req, res, _next) {
                resultOrder.push('user::middleware3');
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
            assert.deepEqual(resultOrder, [
                'root::middleware1',
                'root::middleware2',
                'root::middleware3',
                'user::middleware1',
                'user::middleware2',
                'user::middleware3'
            ]);
            assert.equal(response, 'user::endpoint');
        });

        it('should run endpoints in order when nested routers are present', function() {
            var resultOrder = [];
            var response = '';
            var responseObj = {
                send: function(data) {
                    response = data;
                }
            };

            // root  router endpoints
            router.registerEndpoint('/', function() {
                resultOrder.push('root::root');
                next();
            });

            router.registerEndpoint('/banking', function(_req, res, _next) {
                resultOrder.push('root::banking');
                res.send('root::banking');
            });

            // user endpoints
            var user = new Router();

            user.registerEndpoint('/', function() {
                resultOrder.push('user::root');
                next();
            });

            user.registerEndpoint('/details', function(_req, res, _next) {
                resultOrder.push('user::details');
                res.send('user::details');
            });

            user.registerEndpoint('/banking', function(_req, res, _next) {
                resultOrder.push('user::banking');
                res.send('user::banking');
            });

            router.registerRouter('/user', user);

            router.dispatchRequest('/user/details', {}, responseObj);

            // validation
            assert.deepEqual(resultOrder, ['user::details']);
            assert.equal(response, 'user::details');
        });

        it('should throw on unhandled requests if throwUnhandled is true', function() {
            var router = new Router({
                throwUnhandled: true
            });
            var dispatchOrder = [];
            var responseObj = {
                send: function() {}
            };

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware');
                next();
            });

            router.registerEndpoint('/user', function() {
                dispatchOrder.push('user');
            });

            assert.throws(function() {
                router.dispatchRequest('/', {}, responseObj);
            }, UnhandledRequestError);
        });

        it('should not throw unhandled requests if throwUnhandled is false', function() {
            var dispatchOrder = [];
            var responseObj = {
                send: function() {}
            };

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware');
                next();
            });

            router.registerEndpoint('/user', function(_req, res, _next) {
                dispatchOrder.push('user');
                res.send();
            });

            assert.doesNotThrow(function() {
                router.dispatchRequest('/', {}, responseObj);
            });
        });

        it('should attach path & absolutePath to request object', function() {
            var employee = new Router();
            var responseObj = {
                send: function() {}
            };
            var dispatchOrder;

            router.registerEndpoint('/user', function(req) {
                dispatchOrder.push('user');
                assert.equal(req.path, '/user/');
            });

            router.registerEndpoint('/user/details', function(req) {
                dispatchOrder.push('user details');
                assert.equal(req.path, '/user/details/');
            });

            employee.registerEndpoint('/details', function(req, _res, _next) {
                dispatchOrder.push('employee details');
                assert.equal(req.path, '/details/');
            });

            router.registerRouter('/employee', employee);

            dispatchOrder = [];
            router.dispatchRequest('/user', {}, responseObj);
            assert.deepEqual(dispatchOrder, ['user']);

            dispatchOrder = [];
            router.dispatchRequest('/user/details', {}, responseObj);
            assert.deepEqual(dispatchOrder, ['user details']);

            dispatchOrder = [];
            router.dispatchRequest('/employee/details', {}, responseObj);
            assert.deepEqual(dispatchOrder, ['employee details']);
        });

        it('should stop request processing and call error handling middleware on an error from middleware', function() {
            var router = new Router();
            var dispatchOrder = [];

            router.registerErrorHandlingMiddeware(function(error) {
                dispatchOrder.push('error');
                assert.equal(error.name, 'Error');
                assert.equal(error.message, 'middleware');
            });

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware1');
                next();
            });

            router.registerMiddleware(function(_req, _res, _next) {
                dispatchOrder.push('middleware2');
                throw new Error('middleware');
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

        it('should stop request processing and call error handling middleware on an error from endpoint', function() {
            var router = new Router();
            var dispatchOrder = [];

            router.registerErrorHandlingMiddeware(function(error) {
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
                throw new Error('user');
            });

            router.registerEndpoint('/user', function(_req, _res, next) {
                dispatchOrder.push('user2');
            });

            router.dispatchRequest('/user', {}, responseObj);

            assert.deepEqual(dispatchOrder, ['middleware', 'user1', 'error']);
        });

        it('should throw an UnhandledRequestError when request is unhandled', function() {
            var router = new Router();
            var dispatchOrder = [];

            router.registerErrorHandlingMiddeware(function(error) {
                dispatchOrder.push('error');
                assert.equal(error.name, 'UnhandledRequestError');
            });

            router.registerMiddleware(function(_req, _res, next) {
                dispatchOrder.push('middleware');
                next();
            });

            router.registerEndpoint('/user', function(_req, res, _next) {
                dispatchOrder.push('user');
                res.send();
            });

            router.dispatchRequest('/', {}, responseObj);

            assert.deepEqual(dispatchOrder, ['error']);
        });

        it('should');
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
