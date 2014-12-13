#!/usr/bin/env node

var b = require('browserify');
var through = require('through2');
//var turboloader = require('../turboloader');
var fs = require('fs');
var bpack = require('browser-pack');
var xtend = require('xtend');
var util = require('util');
process.chdir(__dirname);

//We'll have to pass the turboloader an upload url and a current version number
var options = {
	full : '/full.json',
	version : 1,
	replacements : '/changes.json?since=%v',
	alwaysReplace : true
};

//IDEA: basically we create a specially crafted preloader that caches all scripts and ask the servers if there are any changes
//Possible improvements:
//- Decouple script loader from the rest of the script. Preferable we have:
//  1. A loader script that is updated each time from the server
//  2. A fat bundle containing the application which is only downloaded ONCE
//  3. Diff endpoint
//- Don't rely (only) on browser caching, store everything ourselves
//- Automatically generate version diffs

//TODO: fix inconsistent naming
b('./index.js', { debug : true , exposeAll : true })
.plugin(function(bundle, opts) {
	bundle._options.prelude = "Array";
	bundle._options.exposeAll = true;
	bundle.pipeline.get('pack').splice(0, 1, bpack(xtend(bundle._options, { raw : true })));
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

	var bundleString = buff.toString().trim();
	var jsonBundle = bundleStringToJson(bundleString);
	fs.writeFileSync(__dirname + "/full.json", JSON.stringify(jsonBundle, null, 4), "utf8");
})
//.pipe(fs.createWriteStream(__dirname + "/full.json"))
.on('error', function(err) {
	throw err;
});

function bundleStringToJson(moduleString) {
	var preludeArgs = eval(moduleString);
	var modules = preludeArgs[0];
	var serializedModules = {};
	//Map all modules to a serialized format.
	for (var name in modules) {
		var module = modules[name];
		serializedModules[name] = [module[0].toString(), module[1]];
	}
	var bundle = {
		version : 1,
		modules : serializedModules,
		entry : preludeArgs[2]
	};
	return bundle;
}
