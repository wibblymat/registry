'use strict';

var GithubClient = require('github');
var path = require('path');
var url = require('url');

var server = require('../server');

var isowner = function (packageName, token, callback) {
    if (!token) {
        return callback(null, false);
    }

    var githubClient = new GithubClient({
        version: '3.0.0'
    });
    githubClient.authenticate({
        type: 'oauth',
        token: token
    });

    server.database.getPackage(packageName, function (error, result) {
        if (error) {
            return callback(error);
        }
        if (result.rows.length === 0) {
            return callback(new Error('Not found'));
        }

        var pkg = result.rows[0];
        var urlParts = url.parse(pkg.url);
        var pathParts = urlParts.pathname.split('/');

        if (urlParts.hostname !== 'github.com') {
            return callback(null, false); // Not a github hosted package
        }

        if (pathParts.length !== 3 || pathParts[0] !== '') {
            return callback(null, false); // Path is garbage
        }

        var owner = pathParts[1];
        var repo = path.basename(pathParts[2], '.git');

        githubClient.user.get({}, function (error, user) {
            if (error) {
                return callback(error);
            }
            githubClient.repos.getCollaborator({
                user: owner,
                repo: repo,
                collabuser: user.login
            }, callback);
        });
    });
};

exports.remove = function (request, response) {
    /* jshint camelcase: false */
    var token = request.query.access_token;
    /* jshint camelcase: true */

    isowner(request.params.name, token, function (error, result) {
        if (error) {
            return response.send(500, error.message);
        }
        if (!result) {
            return response.send(403);
        }

        server.database.deletePackage(request.params.name, function (error) {
            if (error) {
                return response.send(500, error.message);
            }

            return response.send(204);
        });
    });
};

exports.list = function (request, response) {
    server.status.allPackages++;
    server.database.getPackages(function (error, result) {
        if (error) {
            server.status.errors.allPackagesQuery++;
            return response.send(500, 'Database error');
        }
        response.send(result.rows);
    });
};

exports.create = function (request, response) {
    server.status.createPackage++;
    if (/^git:\/\//.test(request.body.url)) {
        server.database.insertPackage(request.body.name, request.body.url, function (error) {
            if (error) {
                server.status.errors.createPackageQuery++;
                return response.send(406);
            }
            response.send(201);
        });
    } else {
        server.status.errors.badUrl++;
        response.send(400);
    }
};

exports.fetch = function (request, response) {
    server.status.getPackage++;
    server.database.getPackage(request.params.name, function (error, result) {
        if (error) {
            server.status.errors.getPackageQuery++;
            return response.send(500, 'Database error');
        }
        if (result.rows.length === 0) {
            server.status.errors.notFound++;
            return response.send(404);
        }
        response.send(result.rows[0]);

        server.database.hit(request.params.name);
    });
};

exports.search = function (request, response) {
    server.status.searchPackage++;
    server.database.searchPackages(request.params.name, function (error, result) {
        if (error) {
            server.status.errors.searchPackageQuery++;
            return response.send(500, 'Database error');
        }
        response.send(result.rows);
    });
};
