var Paths = require('./paths');

/**
 * Router handles registering and invoking endpoints/middleware/nested routers
 *
 * @param {Object} opt
 * @param {boolean} opt.throwUnhandled - if true, unhandled request will be thrown
 */
function Router(opts) {
    opts = opts || {};

    this.throwUnhandled = opts.throwUnhandled ? true : false;
    this.middleware = [];
    this.stack = [];
}

/**
 * add middleware subscriber
 * first to register will run first
 * middleware will run on all request dispaches before any endpoint
 *  [ middleware ] -> [ endpoints ]
 *
 * ONLY IF next() is called within, request will proceed to next middleware or endpoint
 * IF response is sent from a middleware, request processing will terminate
 *
 * @params { (req, res, next) => void } middleware
 */
Router.prototype.registerMiddleware = function(middleware) {
    if (typeof middleware !== 'function')
        throw new TypeError('param::middleware should be a function');

    this.middleware.push(middleware);
};

/**
 * add endpoint subscriber
 * endpoints will run on request dispatches that matches it's registed path
 * endpoints will run after all router middleware are ran
 * 	[ middleware ] -> [ endpoints ]
 *
 * ONLY IF next() is called within, request will proceed to next endpoint
 * IF response is sent from an endpoint, request processing will terminate
 *
 * @param {string} path
 * @param {(req, res, next) => void} callback
 */
Router.prototype.registerEndpoint = function(path, callback) {
    if (typeof callback !== 'function')
        throw new Error('param::callback should be a function');

    path = Paths.getFormattedPath(path);

    this.stack.push({
        path: path,
        callback: callback
    });
};

/**
 * add router subscriber
 * endpoints will run on request dispatches that matches it's registed path
 * endpoints will run after all router middleware are ran
 * 	[ middleware ] -> [ endpoints ]
 *
 * ONLY IF next() is called within, request will proceed to next endpoint
 * IF response is sent from an endpoint, request processing will terminate
 *
 * @param {string} path
 * @param {Router} router
 */
Router.prototype.registerRouter = function(path, router) {
    if (!(router instanceof Router))
        throw new Error('pram::router should be an instance of Router class');

    path = Paths.getFormattedPath(path);

    this.stack.push({
        path: path,
        router: router
    });
};

/**
 * dispatch an request event
 * NOTE: res object should contain a method named "send()" that sends the response details
 *
 * @param {string} path - request path
 * @param {any} req -request data
 * @param {{send: (data) => void}} res - response object
 */
Router.prototype.dispatchRequest = function(path, req, res) {
    if (!(res && res.send && typeof res.send === 'function'))
        throw new Error('send() method is missing in res object');

    var path = Paths.getFormattedPath(path);
    req.path = path;

    // IF isResponseSent is true, that means response was sent from a middleware or callback
    var isResponseSent = false;
    var currentHandler = 0;
    var send = res.send;
    var unhandledNextEndpoint = this.throwUnhandled
        ? function() {
              throw new UnhandledRequestError();
          }
        : function() {};

    /**
     * wrap res.send callback function
     * IF this method is called it's going to make "isResponseSent", { true }, which means response has been sent
     */
    res.send = function(data) {
        isResponseSent = true;
        return send(data);
    };

    /**
     * initially getNext will return next middleware
     * after the last middleware, getNext will refer getNextEndpoint() to get next endpoint
     */
    getNextMiddleware = getNextMiddleware.bind(this);
    getNextEndpoint = getNextEndpoint.bind(this);

    var getNext = getNextMiddleware;

    function getNextMiddleware() {
        var blankFunction = function() {};

        // IF the response has been sent request processing will terminate after blankFunction is called
        if (isResponseSent) return blankFunction;

        var nextMiddleware = this.middleware[currentHandler++];

        // Once all the middleware are processed, hand over the "next" to getNextEndpoint function
        if (!nextMiddleware) {
            getNext = getNextEndpoint;
            currentHandler = 0;
            // initial getNext() call
            return getNext();
        }

        // returns a function that calls the middleware
        return function() {
            nextMiddleware(req, res, getNext());
        };
    }

    function getNextEndpoint() {
        // IF the response has been sent request processing will terminate after blankFunction is called
        if (isResponseSent) return function() {};

        // looping the stack and looking for a matching endpoint
        while ((nextStackItem = this.stack[currentHandler++])) {
            // IF ROUTER, partial path matching should be done
            if (
                nextStackItem.router &&
                Paths.matchPathsPartially(path, nextStackItem.path)
            ) {
                var nextPath = path.replace(nextStackItem.path, '');
                nextPath = nextPath || '/';
                nextPath = nextPath.startsWith('/') ? nextPath : '/' + nextPath;

                nextPath = Paths.getFormattedPath(nextPath);
                req.path = nextPath;

                return function() {
                    nextStackItem.router.dispatchRequest(nextPath, req, res);
                };
            }

            // IF endpoint, full path matching should be done
            if (
                nextStackItem.callback &&
                Paths.matchPaths(path, nextStackItem.path)
            ) {
                return function() {
                    nextStackItem.callback(req, res, getNext());
                };
            }
        }

        return unhandledNextEndpoint;
    }

    // start dispatching
    getNext()();
};

function UnhandledRequestError(message) {
    this.name = 'UnhandledRequestError';
    this.message = message || '';
}
UnhandledRequestError.prototype = Error.prototype;

module.exports = Router;
module.exports.UnhandledRequestError = UnhandledRequestError;
