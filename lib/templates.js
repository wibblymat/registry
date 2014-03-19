'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('underscore');

var templatePath = path.normalize(path.join(__dirname, '..', 'templates'));
var templates = module.exports = fs.readdirSync(templatePath);

templates.forEach(function (filename) {
	var name = path.basename(filename, '.tpl');
	var template = fs.readFileSync(path.join(templatePath, filename), { encoding: 'utf-8' });
	module.exports[name] = _.template(template);
});
