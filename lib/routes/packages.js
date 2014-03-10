'use strict';

var httpRequest = require('request');
var url = require('url');
var path = require('path');
var serverStatus = require('../status');
var config = require('../config');
var database = require('../database');

exports = {};

exports.isowner = function (request, response) {
	if (!request.session.access_token) {
		return response.redirect('/auth/login?redirectTo=/packages/' + request.params.name + '/isowner');
	}

	database.query('SELECT url FROM packages WHERE name = $1', [request.params.name], function (error, result) {
		if (error) {
			console.log(error);
			return response.send(500);
		}

		if (result.rows.length === 0) {
			return response.send(404);
		}

		var urlParts = url.parse(result.rows[0].url);

		if (urlParts.hostname !== 'github.com') {
			return response.send('Not a github hosted package');
		}

		var pathParts = urlParts.pathname.split('/');

		if (pathParts.length !== 3 || pathParts[0] !== '') {
			return response.send('Confused about path "' + urlParts.pathname + '"');
		}

		var owner = pathParts[1];
		var repo = path.basename(pathParts[2], '.git');
		var user = request.session.user.login;

		httpRequest({
			uri: 'https://api.github.com/repos/' + owner + '/' + repo + '/collaborators/' + user,
			qs: { access_token: request.session.access_token },
			headers: {
				'User-Agent': 'Bower registry server'
			}
		}, function (error, message) {
			if (error) {
				console.log(error);
				return response.send(500);
			}

			if (message.statusCode === 204) {
				response.send('Yes, you are a collaborator for this package');
			} else {
				response.send('Impostor!');
			}
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
