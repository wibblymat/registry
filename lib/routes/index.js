'use strict';
var routes = {
	root: require('./root'),
	packages: require('./packages')
};

module.exports = function (app) {
    app.get('/status', routes.root.status);

    app.get('/packages', routes.packages.list);
    app.get('/packages/:name', routes.packages.fetch);
    app.get('/packages/search/:name', routes.packages.search);
    app.post('/packages', routes.packages.create);
    app.del('/packages/:name', routes.packages.remove);
};
