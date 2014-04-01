var assert = require('chai').assert;
var request = require('request');

var server = require('../lib/server');
var rootRoute = require('../lib/routes/root');
var packagesRoute = require('../lib/routes/packages');

var fakePackages = [
    { name: 'foo1', url: 'bar1', hits: 1 },
    { name: 'foo2', url: 'bar2', hits: 2 },
    { name: 'foo3', url: 'bar3', hits: 3 },
    { name: 'foo4', url: 'bar4', hits: 4 },
    { name: 'foo5', url: 'bar5', hits: 5 },
    { name: 'foo6', url: 'bar6', hits: 6 },
    { name: 'foo7', url: 'bar7', hits: 7 },
    { name: 'foo8', url: 'bar8', hits: 8 },
    { name: 'foo9', url: 'bar9', hits: 9 },
    { name: 'foo10', url: 'bar10', hits: 10 }
];

var makeMockDatabase = function (success) {
    var history = [];

    var error = success ? null : new Error();

    return {
        history: history,
        getPackage: function (name, callback) {
            history.push(['get1', name]);
            callback(error, { rows: [fakePackages[0]] });
        },
        getPackages: function (callback) {
            history.push(['getall']);
            callback(error, { rows: fakePackages });
        },
        insertPackage: function (name, url, callback) {
            history.push(['insert', name, url]);
            callback(error);
        },
        deletePackage: function (name, callback) {
            history.push(['delete', name]);
            callback(error);
        },
        hit: function (name) {
            history.push(['hit', name]);
        },
        searchPackages: function (term, callback) {
            history.push(['search', term]);
            callback(error, { rows: fakePackages });
        },
    };
};

var makeMockResponse = function (callback) {
    return {
        send: function () {
            callback.apply(null, [].slice.apply(arguments));
        },
    };
};

describe('server', function () {
    before(function () {
        var fakeRoutes = function (app) {
            app.get('/', function (request, response) {
                response.send('Hello');
            });
        };

        server.routes = fakeRoutes;
        server.config = { port: 9876 };
    });

    it('can be started and stopped', function (done) {
        server.start(function () {
            server.stop(done);
        });
    });

    it('enables routes', function (done) {
        server.start(function () {
            request('http://localhost:' + server.config.port + '/', function (error, response, body) {
                assert.equal(body, 'Hello');
                server.stop(done);
            });
        });
    });

    after(function () {
        server.routes = null;
        server.config = null;
    });
});

describe('/status/', function () {
    it('exists', function () {
        assert(rootRoute.status);
    });

    it('provides a response', function (done) {
        rootRoute.status({}, makeMockResponse(function (status) {
            assert.isObject(status);
            assert.isObject(status.errors);
            done();
        }));
    });
});

describe('/packages/', function () {
    var fakeRequest = {
        params: {
            name: 'foo'
        },
        body: {
            name: 'foo',
            url: 'git://foo/'
        },
        query: {
            'access_token': '1234567890abcdef'
        }
    };

    beforeEach(function () {
        server.database = makeMockDatabase(true);
    });

    // remove, list, create, fetch, search
    it('has the correct methods', function () {
        assert.isFunction(packagesRoute.remove);
        assert.isFunction(packagesRoute.list);
        assert.isFunction(packagesRoute.create);
        assert.isFunction(packagesRoute.fetch);
        assert.isFunction(packagesRoute.search);
    });

    it('lists the packages in the database', function (done) {
        packagesRoute.list({}, makeMockResponse(function (result) {
            assert.deepEqual(server.database.history, [['getall']]);
            assert.strictEqual(result, fakePackages);
            done();
        }));
    });

    it('fetches a package from the database', function (done) {
        packagesRoute.fetch(fakeRequest, makeMockResponse(function (result) {
            assert.deepEqual(server.database.history, [['get1', 'foo']]);
            assert.strictEqual(result, fakePackages[0]);

            process.nextTick(function () {
                assert.deepEqual(server.database.history, [
                    ['get1', 'foo'],
                    ['hit', 'foo'],
                ]);
                done();
            });
        }));
    });

    it('inserts a package into the database', function (done) {
        packagesRoute.create(fakeRequest, makeMockResponse(function (result) {
            assert.deepEqual(server.database.history, [['insert', 'foo', 'git://foo/']]);
            assert.strictEqual(result, 201);
            done();
        }));
    });

    it('searches for packages in the database', function (done) {
        packagesRoute.search(fakeRequest, makeMockResponse(function (result) {
            assert.deepEqual(server.database.history, [['search', 'foo']]);
            assert.strictEqual(result, fakePackages);
            done();
        }));
    });

    // Skip because otherwise it will try to make real GitHub requests
    // Need to apply dependency injection there, too.
    it.skip('deletes a package from the database', function (done) {
        packagesRoute.remove(fakeRequest, makeMockResponse(function (result) {
            assert.deepEqual(server.database.history, [['delete', 'foo']]);
            assert.strictEqual(result, 204);
            done();
        }));
    });
});

describe('/packages/ handles database errors', function () {
    var fakeRequest = {
        params: {
            name: 'foo'
        },
        body: {
            name: 'foo',
            url: 'git://foo/'
        },
        query: {
            'access_token': '1234567890abcdef'
        }
    };

    beforeEach(function () {
        server.database = makeMockDatabase(false);
    });

    it('on list', function (done) {
        packagesRoute.list(fakeRequest, makeMockResponse(function (result) {
            assert.strictEqual(result, 500);
            done();
        }));
    });

    it('on fetch', function (done) {
        packagesRoute.fetch(fakeRequest, makeMockResponse(function (result) {
            assert.strictEqual(result, 500);
            done();
        }));
    });

    it('on insert', function (done) {
        packagesRoute.create(fakeRequest, makeMockResponse(function (result) {
            // The error code is different here for legacy reasons
            assert.strictEqual(result, 406);
            done();
        }));
    });

    it('on search', function (done) {
        packagesRoute.search(fakeRequest, makeMockResponse(function (result) {
            assert.strictEqual(result, 500);
            done();
        }));
    });

    it('on delete', function (done) {
        packagesRoute.remove(fakeRequest, makeMockResponse(function (result) {
            assert.strictEqual(result, 500);
            done();
        }));
    });
});
