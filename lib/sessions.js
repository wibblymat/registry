'use strict';

var express = require('express');

// TODO: Persist sessions?
module.exports = express.session({secret: process.env.CLIENT_SECRET});
