'use strict';

var httpRequest = require('request');
var url = require('url');

module.exports = {};

var checkCode = (function () {
	// TODO: LRU cache for codes
	var codes = {};
	var chars = '0123456789abcdef';

	return function (toCheck) {
		// TODO: Check timestamp
		if (toCheck) {
			var date = codes[toCheck];
			delete codes[toCheck];
			return date || false;
		}

		// TODO: Crypto secure random numbers
		var code = '';

		while (code === '' || codes[code]) {
			code = '';
			for (var i = 0; i < 16; i++) {
				code += chars[Math.floor(Math.random() * 16)];
			}
		}

		codes[code] = new Date();

		return code;
	};
})();

module.exports.authenticate = function (request, response) {
	var state = {
		redirectTo: request.query.redirectTo || '',
		check: checkCode()
	};

	var parameters = {
		scope: 'user,repo',
		client_id: process.env.CLIENT_ID,
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

module.exports.callback = function (request, response) {
	var code = request.query.code;
	var state = JSON.parse(request.query.state);

	if (!checkCode(state.check || '')) {
		return response.send(403);
	}

	var parameters = {
		code: code,
		client_id: process.env.CLIENT_ID,
		client_secret: process.env.CLIENT_SECRET
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
				'User-Agent': 'Bower registry server'
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
