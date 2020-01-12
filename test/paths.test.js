var assert = require('assert');
var Paths = require('../src/paths');

describe('Paths', function() {
    describe('matchPaths()', function() {
        it('should throw on non string paths', function() {
            assert.throws(function() {
                Paths.matchPaths({}, '/sample');
            });
            assert.throws(function() {
                Paths.matchPaths(true, '/sample');
            });
            assert.throws(function() {
                Paths.matchPaths('/sample', function() {});
            });
        });

        it('should throw on invalid path characters', function() {
            assert.throws(function() {
                Paths.matchPaths('/sample', '');
            });
            assert.throws(function() {
                Paths.matchPaths('', '/sample');
            });
            assert.throws(function() {
                Paths.matchPaths('', '');
            });
            assert.throws(function() {
                Paths.matchPaths('%', '/sample');
            });
            assert.throws(function() {
                Paths.matchPaths('sample', '%');
            });
        });

        it('should throw on invalid path formats', function() {
            assert.throws(function() {
                Paths.matchPaths('endpoint', '/endpoint');
            });
            assert.throws(function() {
                Paths.matchPaths('/endpoint', 'endpoint');
            });
            assert.throws(function() {
                Paths.matchPaths('endpoint', 'endpoint');
            });
            assert.throws(function() {
                Paths.matchPaths('/endpoint//endpoint', '/endpoint');
            });
            assert.throws(function() {
                Paths.matchPaths('/endpoint', '/endpoint//endpoint');
            });
            assert.throws(function() {
                Paths.matchPaths('/endpoint//endpoint', '/endpoint//endpoint');
            });
            assert.throws(function() {
                Paths.matchPaths('/endpoint/endpoint//', '/endpoint');
            });
            assert.throws(function() {
                Paths.matchPaths('/endpoint', '/endpoint/endpoint//');
            });
            assert.throws(function() {
                Paths.matchPaths(
                    '/endpoint/endpoint//',
                    '/endpoint/endpoint//'
                );
            });
        });

        it('exact same paths should match', function() {
            assert.equal(Paths.matchPaths('/', '/'), true);
            assert.equal(Paths.matchPaths('/sample', '/sample'), true);
            assert.equal(
                Paths.matchPaths('/sample/path/', '/sample/path/'),
                true
            );
        });
    });

    describe('matchPathsPartially()', function() {
        it('should throw on non string paths', function() {
            assert.throws(function() {
                Paths.matchPathsPartially({}, '/sample');
            });
            assert.throws(function() {
                Paths.matchPathsPartially(true, '/sample');
            });
            assert.throws(function() {
                Paths.matchPathsPartially('/sample', function() {});
            });
        });

        it('should throw on invalid path characters', function() {
            assert.throws(function() {
                Paths.matchPathsPartially('/sample', '');
            });
            assert.throws(function() {
                Paths.matchPathsPartially('', '/sample');
            });
            assert.throws(function() {
                Paths.matchPathsPartially('', '');
            });
            assert.throws(function() {
                Paths.matchPathsPartially('%', '/sample');
            });
            assert.throws(function() {
                Paths.matchPathsPartially('sample', '%');
            });
        });

        it('should throw on invalid path formats', function() {
            assert.throws(function() {
                Paths.matchPathsPartially('endpoint', '/endpoint');
            });
            assert.throws(function() {
                Paths.matchPathsPartially('/endpoint', 'endpoint');
            });
            assert.throws(function() {
                Paths.matchPathsPartially('endpoint', 'endpoint');
            });
            assert.throws(function() {
                Paths.matchPathsPartially('/endpoint//endpoint', '/endpoint');
            });
            assert.throws(function() {
                Paths.matchPathsPartially('/endpoint', '/endpoint//endpoint');
            });
            assert.throws(function() {
                Paths.matchPathsPartially(
                    '/endpoint//endpoint',
                    '/endpoint//endpoint'
                );
            });
            assert.throws(function() {
                Paths.matchPathsPartially('/endpoint/endpoint//', '/endpoint');
            });
            assert.throws(function() {
                Paths.matchPathsPartially('/endpoint', '/endpoint/endpoint//');
            });
            assert.throws(function() {
                Paths.matchPathsPartially(
                    '/endpoint/endpoint//',
                    '/endpoint/endpoint//'
                );
            });
        });

        it('should return true for partially  matching paths', function() {
            assert.equal(Paths.matchPathsPartially('/user/', '/'), true);
            assert.equal(Paths.matchPathsPartially('/user/', '/user/'), true);
            assert.equal(
                Paths.matchPathsPartially('/user/path/', '/user/'),
                true
            );
            assert.equal(
                Paths.matchPathsPartially('/user/path/', '/user/path/'),
                true
            );
        });

        it('should return false for partially not matching paths', function() {
            assert.equal(Paths.matchPathsPartially('/user/', '/other'), false);
            assert.equal(
                Paths.matchPathsPartially('/user/other', '/user/abc'),
                false
            );
            assert.equal(
                Paths.matchPathsPartially('/user/path/', '/user/'),
                true
            );
            assert.equal(
                Paths.matchPathsPartially('/user/path/', '/user/path/'),
                true
            );
        });
    });

    describe('isPathValid()', function() {
        it('should throw on non string paths', function() {
            assert.throws(function() {
                Paths.isPathValid(false);
            });
            assert.throws(function() {
                Paths.isPathValid({});
            });
            assert.throws(function() {
                Paths.isPathValid(function() {});
            });
        });

        it('should return false on empty values', function() {
            assert.equal(Paths.isPathValid(''), false);
        });

        it('should return true for valid paths', function() {
            assert.equal(Paths.isPathValid('/path'), true);
            assert.equal(Paths.isPathValid('/path/'), true);
            assert.equal(Paths.isPathValid('/path1/path2'), true);
            assert.equal(Paths.isPathValid('/path1/path2/'), true);
            assert.equal(Paths.isPathValid('/path1/path2/path3'), true);
            assert.equal(Paths.isPathValid('/path1/path2/path3/'), true);
        });

        it('should return false for invalid paths', function() {
            assert.equal(Paths.isPathValid('path'), false);
            assert.equal(Paths.isPathValid('path/'), false);

            assert.equal(Paths.isPathValid('//path'), false);
            assert.equal(Paths.isPathValid('path//'), false);
            assert.equal(Paths.isPathValid('//path//'), false);

            assert.equal(Paths.isPathValid('path1/path2'), false);
            assert.equal(Paths.isPathValid('path1/path2/'), false);
            assert.equal(Paths.isPathValid('//path1/path2/'), false);
            assert.equal(Paths.isPathValid('/path1/path2//'), false);
            assert.equal(Paths.isPathValid('//path1/path2//'), false);

            assert.equal(Paths.isPathValid('/path1//path2/path3'), false);
            assert.equal(Paths.isPathValid('/path1/path2//path3/'), false);
        });

        it('should not allow invalid characters', function() {
            assert.equal(Paths.isPathValid('path%'), false);
            assert.equal(Paths.isPathValid('path%20'), false);
            assert.equal(Paths.isPathValid('/#path'), false);
            assert.equal(Paths.isPathValid('/path^'), false);
            assert.equal(Paths.isPathValid('/pa!th'), false);
        });
    });

    describe('isPathValidStrict()', function() {
        it('should throw on non string paths', function() {
            assert.throws(function() {
                Paths.isPathValidStrict(false);
            });
            assert.throws(function() {
                Paths.isPathValidStrict({});
            });
            assert.throws(function() {
                Paths.isPathValidStrict(function() {});
            });
        });

        it('should throw on empty values', function() {
            assert.throws(function() {
                Paths.isPathValidStrictStrict('');
            });
        });

        it('should not throw on valid paths', function() {
            assert.doesNotThrow(function() {
                Paths.isPathValidStrict('/path');
            });
            assert.doesNotThrow(function() {
                Paths.isPathValidStrict('/path/');
            });
            assert.doesNotThrow(function() {
                Paths.isPathValidStrict('/path1/path2');
            });
            assert.doesNotThrow(function() {
                Paths.isPathValidStrict('/path1/path2/');
            });
            assert.doesNotThrow(function() {
                Paths.isPathValidStrict('/path1/path2/path3');
            });
            assert.doesNotThrow(function() {
                Paths.isPathValidStrict('/path1/path2/path3/');
            });
        });

        it('should throw on invalid paths', function() {
            assert.throws(function() {
                Paths.isPathValidStrict('path');
            });
            assert.throws(function() {
                Paths.isPathValidStrict('path/');
            });

            assert.throws(function() {
                Paths.isPathValidStrict('//path');
            });
            assert.throws(function() {
                Paths.isPathValidStrict('path//');
            });
            assert.throws(function() {
                Paths.isPathValidStrict('//path//');
            });

            assert.throws(function() {
                Paths.isPathValidStrict('path1/path2');
            });
            assert.throws(function() {
                Paths.isPathValidStrict('path1/path2/');
            });
            assert.throws(function() {
                Paths.isPathValidStrict('//path1/path2/');
            });
            assert.throws(function() {
                Paths.isPathValidStrict('/path1/path2//');
            });
            assert.throws(function() {
                Paths.isPathValidStrict('//path1/path2//');
            });

            assert.throws(function() {
                Paths.isPathValidStrict('/path1//path2/path3');
            });
            assert.throws(function() {
                Paths.isPathValidStrict('/path1/path2//path3/');
            });
        });

        it('should throw on invalid characters', function() {
            assert.throws(function() {
                Paths.isPathValidStrict('path%');
            });
            assert.throws(function() {
                Paths.isPathValidStrict('path%20');
            });
            assert.throws(function() {
                Paths.isPathValidStrict('/#path');
            });
            assert.throws(function() {
                Paths.isPathValidStrict('/path^');
            });
            assert.throws(function() {
                Paths.isPathValidStrict('/pa!th');
            });
        });
    });

    describe('getFormattedPath()', function() {
        it('should format the path', function() {
            assert.equal(Paths.getFormattedPath('/path'), '/path/');
            assert.equal(
                Paths.getFormattedPath('/path1/path2'),
                '/path1/path2/'
            );
        });

        it('should return root if the path is root', function() {
            assert.equal(Paths.getFormattedPath('/'), '/');
        });

        it('should throw on invalid paths', function() {
            assert.throws(function() {
                Paths.getFormattedPath('path');
            });
            assert.throws(function() {
                Paths.getFormattedPath('path/');
            });

            assert.throws(function() {
                Paths.getFormattedPath('//path');
            });
            assert.throws(function() {
                Paths.getFormattedPath('path//');
            });
            assert.throws(function() {
                Paths.getFormattedPath('//path//');
            });

            assert.throws(function() {
                Paths.getFormattedPath('path1/path2');
            });
            assert.throws(function() {
                Paths.getFormattedPath('path1/path2/');
            });
            assert.throws(function() {
                Paths.getFormattedPath('//path1/path2/');
            });
            assert.throws(function() {
                Paths.getFormattedPath('/path1/path2//');
            });
            assert.throws(function() {
                Paths.getFormattedPath('//path1/path2//');
            });

            assert.throws(function() {
                Paths.getFormattedPath('/path1//path2/path3');
            });
            assert.throws(function() {
                Paths.getFormattedPath('/path1/path2//path3/');
            });
        });
    });
});
