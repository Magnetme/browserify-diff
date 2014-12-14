#!/usr/bin/env node

var b = require('browserify');
var through = require('through2');
var fs = require('fs');
var bpack = require('browser-pack');
var xtend = require('xtend');
var util = require('util');
var _ = require('lodash');
process.chdir(__dirname);

//TODO: configurable
var previousFile = '/previous.json';
var version = 3;
var diffFile = '/changes.json';
var outFile = '/full.json';

//IDEA: basically we create a specially crafted preloader that caches all scripts and ask the servers if there are any changes
//Possible improvements:
//- Automatically generate version diffs

//TODO: fix inconsistent naming
b('./index.js', { debug : true , exposeAll : true })
.plugin(function(bundle, opts) {
	//We need to be able to parse the generated module definition.
	//We do this a bit hacky by setting prelude to Array, resulting in an output of the form
	//Array(<modules>, <cache>, <entry>), which we can eval.
	bundle._options.prelude = "Array";
	bundle._options.exposeAll = true;
	bundle.pipeline.get('pack').splice(0, 1, bpack(xtend(bundle._options, { raw : true })));
})
.bundle(function(err, buff) {
	if (err) throw err;

	var bundleString = buff.toString().trim();
	var jsonBundle = bundleStringToJson(bundleString, version);
	//TODO: async/streams & errors
	if (fs.existsSync(__dirname + previousFile)) {
		var previousBundle = JSON.parse(fs.readFileSync(__dirname + previousFile, "utf8"));
		var diff = createDiff(previousBundle, jsonBundle);
		fs.writeFileSync(__dirname + diffFile, JSON.stringify(diff, null, 4), "utf8");
	}
	fs.writeFileSync(__dirname + outFile, JSON.stringify(jsonBundle, null, 4), "utf8");
})
//.pipe(fs.createWriteStream(__dirname + "/full.json"))
.on('error', function(err) {
	throw err;
});

function createDiff(base, newBundle) {
	var diff = {
		"version" : newBundle.version
	};
	diff.modules = _(newBundle.modules)
		.keys()
		.filter(function changed(key) {
			//Module should be in diff if it's new (not in base) or if it's content has been changed.
			//Note that we don't need to check it's dependencies, since a change in dependencies also
			//results in a change in content
			return !base.modules[key] || base.modules[key][0] !== newBundle.modules[key][0];
		})
		.map(function pairs(key) {
			return [key, newBundle.modules[key]];
		})
		.zipObject()
		.value();
	//TODO: test if removed modules & new entries work as expected
	var removedModules = _.difference(Object.keys(base.modules), Object.keys(newBundle.modules));
	_.each(removedModules, function(removed) {
		diff.modules[removed] = null;
	});
	if (_.difference(base.entry, newBundle.entry).length || _.difference(newBundle.entry, base.entry).length) {
		diff.entry = newBundle.entry;
	}
	return diff;
}

function bundleStringToJson(moduleString, version) {
	var preludeArgs = eval(moduleString);
	var modules = preludeArgs[0];
	var serializedModules = {};
	//Map all modules to a serialized format.
	for (var name in modules) {
		var module = modules[name];
		serializedModules[name] = [module[0].toString(), module[1]];
	}
	var bundle = {
		version : version,
		modules : serializedModules,
		entry : preludeArgs[2]
	};
	return bundle;
}
