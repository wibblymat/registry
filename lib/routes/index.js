'use strict';
var app = module.parent.exports.app;
var middleware = require('../middleware');

var routes = {
	root: require('./root'),
	packages: require('./packages'),
	auth: require('./auth')
};

app.get('/status', routes.root.status);

app.get('/auth/login', routes.auth.authenticate);
app.get('/auth/callback', middleware.session, routes.auth.callback);

app.get('/packages', routes.packages.list);
app.get('/packages/:name', routes.packages.fetch);
app.get('/packages/search/:name', routes.packages.search);
app.post('/packages', routes.packages.create);

app.get('/packages/:name/manage', middleware.auth, routes.packages.manage);
app.del('/packages/:name', middleware.auth, routes.packages.remove);
