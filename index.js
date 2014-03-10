'use strict';

var express = require('express');

var app = express();

app.configure(function () {
	app.use(express.cookieParser());
	app.use(express.logger());
	app.use(express.compress());
	app.use(express.bodyParser());
	app.use(app.router);
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.listen(process.env.PORT);

exports.app = app;
require('./lib/routes');
