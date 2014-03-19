var request = require('request');
var url = require('url');
var config = require('./config');

var GithubClient = function (accessToken) {
    this.accessToken = accessToken || '';
};

GithubClient.getAuthUrl = function (scope, redirectUrl, state) {
    var parameters = {
        scope: scope,
        'client_id': config.github.clientId,
        'redirect_uri': redirectUrl,
        state: state
    };

    return url.format({
        hostname: 'github.com',
        protocol: 'https',
        pathname: '/login/oauth/authorize',
        query: parameters
    });
};

GithubClient.authenticate = function (code, callback) {
    var parameters = {
        code: code,
        'client_id': config.github.clientId,
        'client_secret': config.github.clientSecret
    };

    request({
        uri: 'https://github.com/login/oauth/access_token',
        form: parameters,
        method: 'POST',
        headers: {
            'Accept': 'application/json'
        }
    }, function (error, message, body) {
        if (error) {
            return callback(error);
        }

        body = JSON.parse(body);

        callback(null, body.access_token);
    });
};

GithubClient.prototype = {
    request: function (url, method, body, callback) {
        if (typeof method === 'function') {
            callback = method;
            body = null;
            method = 'GET';
        }

        if (typeof body === 'function') {
            callback = body;
            body = null;
        }

        if (typeof callback !== 'function') {
            callback = function () {};
        }

        // TODO: Add body and method parameters
        request({
            uri: 'https://api.github.com/' + url,
            qs: { 'access_token': this.accessToken },
            headers: {
                'User-Agent': config.userAgent
            }
        }, function (error, message, body) {
            if (error) {
                callback(error);
            }

            callback(null, message, body);
        });
    },

    getCurrentUser: function (callback) {
        this.request('user', function (error, message, body) {
            if (error) {
                return callback(error);
            }

            callback(null, JSON.parse(body));
        });
    },

    isowner: function (username, owner, repo, callback) {
        this.request('repos/' + owner + '/' + repo + '/collaborators/' + username, function (error, message) {
            if (error) {
                callback(error);
            }
            callback(null, message.statusCode === 204);
        });
    }
};

module.exports = GithubClient;
