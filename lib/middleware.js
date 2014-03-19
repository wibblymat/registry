'use strict';

var express = require('express');
var config = require('./config');
var GithubClient = require('./github');
var sessionMiddleware = express.session({secret: config.sessionSecret});
// TODO: Persist sessions?
module.exports = {
    session: sessionMiddleware,
    auth: function (request, response, next) {
        sessionMiddleware(request, response, function (error) {
            if (error) {
                return next(error);
            }

            var token = request.query.access_token || request.body.access_token || request.session.accessToken;

            if (token) {
                request.githubClient = new GithubClient(token);
                return next();
            }

            var acceptJson = false;

            request.headers.accept.split(',').forEach(function (value) {
                var parts = value.split('/', 2);

                if (parts[1] === 'json') {
                    acceptJson = true;
                }
            });

            if (acceptJson || request.method !== 'GET') {
                return response.send(403, {error: 'Not logged in'});
            } else {
                return response.redirect('/auth/login?redirectTo=' + request.url);
            }
        });
    }
};
