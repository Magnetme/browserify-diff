#!/usr/bin/env node

var b = require('browserify');
var through = require('through2');
var turboloader = require('./turboloader');

//We'll have to pass the turboloader an upload url and a current version number
var options = {
	version : 1,
	replacements : '/changes.json?since=%v'
};

//IDEA: basically we create a specially crafted preloader that caches all scripts and ask the servers if there are any changes
//Possible improvements:
//- Decouple script loader from the rest of the script. Preferable we have:
//  1. A loader script that is updated each time from the server
//  2. A fat bundle containing the application which is only downloaded ONCE
//  3. Diff endpoint
//- Don't rely (only) on browser caching, store everything ourselves
//- Automatically generate version diffs
//- Make it debuggable. (No idea how yet. Perhaps instead of loading the changes over json we should use script tags or something)
//  Note on this: it seems that I'm able to provide either sourcemaps or sourceURLs in the injected scripts.
//  I can probably (ab)use this to let the script appear at the right place in the debugger. With the sourceURL
//  attribute I already was able to get it appear in Chrome's debugger (bot not yet executable, scoping issues)

//TODO: fix inconsistent naming
b('./index.js', { debug : true, exposeAll: true, prelude: turboloader.createPrelude(options) })
.plugin(function(bundle, opts) {
//	console.log(bundle.pipeline.get('pack'))
	/*
	bundle.pipeline.get('json').unshift(through.obj(function(row, enc, next) {
		console.log("json");
		console.log(arguments);
		this.push(row);
		next();
	}));
	bundle.pipeline.get('label').unshift(through.obj(function(row, enc, next) {
		console.log("label");
		console.log(arguments);
		this.push(row);
		next();
	}));
	bundle.pipeline.get('emit-deps').unshift(through.obj(function(row, enc, next) {
		console.log("ed");
		console.log(arguments);
		this.push(row);
		next();
	}));
	bundle.pipeline.get('pack').unshift(through.obj(function(row, enc, next) {
		console.log(arguments);
		this.push(row);
		next();
	}));
	bundle.pipeline.push(through.obj(function(row, enc, next) {
		console.log('version');
		console.log(arguments);
		this.push(row);
		next();
	}));
	*/



})
.bundle(function(err, buff) {
	if (err) throw err;

	console.log(buff.toString());
});
