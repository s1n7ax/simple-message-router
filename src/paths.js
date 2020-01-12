var Paths = {};

/**
 * match two given paths
 * IF paths are similar, TRUE will returned
 * IF paths are NOT similar, FALSE will returned
 *
 * @param {string} srcPath path that should be match against
 * @param {string} targetPath path that should be compare
 * @returns {boolean}
 */
Paths.matchPaths = function(srcPath, targetPath) {
    Paths.isPathValidStrict(srcPath);
    Paths.isPathValidStrict(targetPath);

    return srcPath === targetPath;
};

/**
 * partial match two given paths
 * IF target path has at least part of the path correct from the path start, it's considered as a match
 * IF paths are partially similar, TRUE will returned
 * IF paths are NOT partially similar, FALSE will returned
 *
 * ex:-
 *  MATCH:
 *      src: /user/details
 *      target: /user/
 *
 *  NOT A MATCH:
 *      src: /user/details/
 *      target: /details/
 *
 * @param {string} srcPath path that should be match against
 * @param {string} targetPath path that should be compare
 * @returns {boolean}
 */
Paths.matchPathsPartially = function(srcPath, targetPath) {
    Paths.isPathValidStrict(srcPath);
    Paths.isPathValidStrict(targetPath);

    return srcPath.startsWith(targetPath);
};

/**
 * format given path to application standard path format
 * IF the path doesn't end with '/', this method will add '/' to path's end
 *
 * @param {string} path that should be formated
 * @returns {string} formatted path
 */
Paths.getFormattedPath = function(path) {
    Paths.isPathValidStrict(path);

    if (path === '/') return path;

    if (!path.endsWith('/')) return path + '/';

    return path;
};

/**
 * validate given path
 * IF valid TRUE will be returned
 *
 * ex:-
 *  VALID PATHS
 * 	    path: /
 *  	path: /user
 *  	path: /user/
 *  	path: /user/details
 *  	path: /user/details/
 *
 *  INVALID PATHS
 *	    path: //
 *	    path: /user//
 *	    path: /user//details
 *	    path: user/details/
 *
 * @param {string} path - path that should be validated
 * @returns {boolean}
 * @throws {TypeError} - throws if path is not a string
 */
Paths.isPathValid = function(path) {
    // throw if path is not string
    if (typeof path !== 'string')
        throw new TypeError(`path should be a string::${path}`);

    var validPathRegex = /(^\/(\w+\/?)+$|^\/$)/;
    return validPathRegex.test(path);
};

/**
 * validate given path
 * IF path is NOT valid, Error will be thrown
 *
 * @throws {Error} throws if the path is not valid
 * @param {string} path - path
 * @returns {void}
 */
Paths.isPathValidStrict = function(path) {
    if (!Paths.isPathValid(path)) throw new Error(`invalid path::${path}`);
};

module.exports = Paths;
