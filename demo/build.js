#!/usr/bin/env node


var browserify = require('browserify');
var browserifyDiff = require('..');
var fs = require('fs');
process.chdir(__dirname);

var previousFile = __dirname + '/previous.json';
var version = 3;
var diffFile = __dirname + '/changes.json';
var outFile = __dirname + '/full.json';

browserify('./index.js', browserifyDiff.browserifyOptions)
	.plugin(browserifyDiff.plugin, {
		version : version,
		previousBuild : JSON.parse(fs.readFileSync(previousFile, 'utf8')),
		diffFile : diffFile
	})
	.bundle()
	.pipe(fs.createWriteStream(outFile));



