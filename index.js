'use strict';

var config = require('./lib/config');
var database = require('./lib/database');
var routes = require('./lib/routes');
var server = require('./lib/server');

server.config = config;
server.routes = routes;
server.database = database;
server.start();
