var express = require('express');
var status = require('./status');

var Server = function () {
    var app = this.app = express();
    this.database = null;
    this.routes = null;
    this.config = null;
    this.status = status;

    var httpServer;

    this.start = function (callback) {
        app.configure(function () {
            app.use(express.logger());
            app.use(express.compress());
            app.use(express.urlencoded());
            app.use(express.json());
            app.use(app.router);
            app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
        });
        this.routes(app);
        httpServer = app.listen(this.config.port, callback);
    };

    this.stop = function (callback) {
        httpServer.close(callback);
    };
};

module.exports = new Server();
