'use strict';

var httpRequest = require('request');
var url = require('url');
var config = require('../config');
var crypto = require('crypto');
var LRU = require('lru-cache');

exports = {};

// We verify that requests to the callback endpoint are really callbacks for
// OAuth requests we made by providing some state with the request. This code
// handles the creating a token to use as state, verifying it, and expiring
// tokens after a reasonable time.
var checkCode = (function () {
	// Using LRU due to memory-exhaustion paranoia. Also handles expiring the
	// state for us.
	var codes = LRU({
		max: 10000,
		maxAge: 1000 * 60 * 10 // 5 minutes
	});

	return function (toCheck) {
		if (toCheck) {
			var result = codes.get(toCheck);
			codes.del(toCheck);
			return result || false;
		}

		var code = '';

		while (code === '' || codes.peek(code)) {
			code = crypto.randomBytes(8).toString('hex');
		}

		codes.set(code, true);

		return code;
	};
})();

exports.authenticate = function (request, response) {
	var state = {
		redirectTo: request.query.redirectTo || '',
		check: checkCode()
	};

	var parameters = {
		scope: 'user,repo',
		client_id: config.github.clientId,
		redirect_uri: 'http://localhost:4000/auth/callback',
		state: JSON.stringify(state)
	};

	response.redirect(url.format({
		hostname: 'github.com',
		protocol: 'https',
		pathname: '/login/oauth/authorize',
		query: parameters
	}));
};

exports.callback = function (request, response) {
	var code = request.query.code;
	var state = JSON.parse(request.query.state);

	if (!checkCode(state.check || '')) {
		return response.send(403);
	}

	var parameters = {
		code: code,
		client_id: config.github.clientId,
		client_secret: config.github.clientSecret
	};

	httpRequest({
		uri: 'https://github.com/login/oauth/access_token',
		form: parameters,
		method: 'POST',
		headers: {
			'Accept': 'application/json'
		}
	}, function (error, message, body) {
		if (error) {
			console.log(error);
			return response.send(500);
		}

		body = JSON.parse(body);

		request.session.access_token = body.access_token;

		httpRequest({
			uri: 'https://api.github.com/user',
			qs: { access_token: request.session.access_token },
			headers: {
				'User-Agent': config.userAgent
			}
		}, function (error, message, body) {
			if (error) {
				return response.send(500);
			}

			request.session.user = JSON.parse(body);

			if (state.redirectTo) {
				response.redirect(state.redirectTo);
			} else {
				response.send('Authorized');
			}
		});
	});
};
