'use strict';

var server = require('../server');

exports.status = function (request, response) {
	response.send(server.status);
};
