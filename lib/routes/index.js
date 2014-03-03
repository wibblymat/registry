'use strict';
var app = module.parent.exports.app;
var sessionHandler = require('../sessions');

var routes = {
	root: require('./root'),
	packages: require('./packages'),
	auth: require('./auth')
};

app.get('/status', routes.root.status);

app.get('/auth/login', routes.auth.authenticate);
app.get('/auth/callback', sessionHandler, routes.auth.callback);

app.get('/packages/:name/isowner', sessionHandler, routes.packages.isowner);
app.get('/packages', routes.packages.list);
app.get('/packages/:name', routes.packages.fetch);
app.get('/packages/search/:name', routes.packages.search);
app.post('/packages', routes.packages.create);
