'use strict';

var crypto = require('crypto');
var LRU = require('lru-cache');
var GithubClient = require('../github');

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

	var scope = 'user,repo';
	var redirectUrl = 'http://localhost:4000/auth/callback';

	response.redirect(GithubClient.getAuthUrl(scope, redirectUrl, JSON.stringify(state)));
};

exports.callback = function (request, response) {
	var code = request.query.code;
	var state = JSON.parse(request.query.state);

	if (!checkCode(state.check || '')) {
		return response.send(403);
	}

	GithubClient.authenticate(code, function (error, accessToken) {
		if (error) {
			return response.send(500);
		} else if (!accessToken) {
			return response.send(403);
		}

		request.session.accessToken = accessToken;

		if (state.redirectTo) {
			response.redirect(state.redirectTo);
		} else {
			response.send('Authorized');
		}
	});
};
