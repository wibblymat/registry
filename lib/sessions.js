'use strict';

var express = require('express');
var config = require('./config');

// TODO: Persist sessions?
exports = express.session({secret: config.sessionSecret});
