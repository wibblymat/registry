'use strict';

var serverStatus = require('../status');
var database = require('../database');
var templates = require('../templates');
var url = require('url');
var path = require('path');

var isowner = function (packageName, githubClient, callback) {
    database.getPackage(packageName, function (error, result) {
        if (error) {
            return callback(error);
        }
        if (result.rows.length === 0) {
            return callback(new Error('Not found'));
        }
        var pkg = result.rows[0];
        var urlParts = url.parse(pkg.url);

        if (urlParts.hostname !== 'github.com') {
            return callback(null, false); // Not a github hosted package
        }

        var pathParts = urlParts.pathname.split('/');

        if (pathParts.length !== 3 || pathParts[0] !== '') {
            return callback(null, false); // Path is garbage
        }

        var owner = pathParts[1];
        var repo = path.basename(pathParts[2], '.git');

        githubClient.getCurrentUser(function (error, user) {
            githubClient.isowner(user.login, owner, repo, callback);
        });
    });
};

exports.manage = function (request, response) {
	var name = request.params.name;
	isowner(name, request.githubClient, function (error, result) {
		if (error) {
			return response.send(500, error.message);
		}
		if (!result) {
			return response.send(403);
		}
		database.getPackage(name, function (error, result) {
			response.send(templates['manage-package'](result.rows[0]));
		});
	});
};

exports.remove = function (request, response) {
	isowner(request.params.name, request.githubClient, function (error, result) {
		if (error) {
			return response.send(500, error.message);
		}
        if (!result) {
            return response.send(403);
        }

        database.deletePackage(request.params.name, function (error) {
            if (error) {
                return response.send(500, error.message);
            }

            return response.send(204);
        });
	});
};

// TODO(wibblymat): All of these nested if (error) {...} statements would just disappear if we used promises
exports.claim = function (request, response) {
	isowner(request.params.name, request.githubClient, function (error, result) {
		if (error) {
			return response.send(500, error.message);
		}
        if (!result) {
            return response.send(403);
        }

        database.getOwners(request.params.name, function (error, owners) {
            if (error) {
                return response.send(500, error.message);
            }

            if (owners.length !== 0) {
            	return response.send(403, 'Already claimed');
            }

            request.githubClient.getCurrentUser(function (error, user) {
	            if (error) {
	                return response.send(500, error.message);
	            }
            	database.addOwner(request.params.name, user.login, function (error) {
		            if (error) {
		                return response.send(500, error.message);
		            }
            		return response.send(204);
            	});
       		});
        });
	});
};

exports.list = function (request, response) {
    serverStatus.allPackages++;
    database.getPackages(function (error, result) {
        if (error) {
            serverStatus.errors.allPackagesQuery++;
            return response.send(500, 'Database error');
        }
        response.send(result.rows);
    });
};

exports.create = function (request, response) {
    serverStatus.createPackage++;
    if (/^git:\/\//.test(request.body.url)) {
        database.insertPackage(request.body.name, request.body.url, function (error) {
            if (error) {
                serverStatus.errors.createPackageQuery++;
                return response.send(406);
            }
            response.send(201);
        });
    } else {
        serverStatus.errors.badUrl++;
        response.send(400);
    }
};

exports.fetch = function (request, response) {
    serverStatus.getPackage++;
    database.getPackage(request.params.name, function (error, result) {
        if (error) {
            serverStatus.errors.getPackageQuery++;
            return response.send(500, 'Database error');
        }
        if (result.rows.length === 0) {
            serverStatus.errors.notFound++;
            return response.send(404);
        }
        response.send(result.rows[0]);

        database.hit(request.params.name);
    });
};

exports.search = function (request, response) {
    serverStatus.searchPackage++;
    database.searchPackages(request.params.name, function (error, result) {
        if (error) {
            serverStatus.errors.searchPackageQuery++;
            return response.send(500, 'Database error');
        }
        response.send(result.rows);
    });
};
