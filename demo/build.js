#!/usr/bin/env node

//TODO: sourcemap support

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

var moduleHeader = 'function(require,module,exports){\n';
var moduleFooter = '}';
/**
 * Creates a JSON string of a module.
 */
function createModuleJSONString(module) {
	return '"' + (moduleHeader + module + moduleFooter)
		.replace(/[\n\r]/g, '\\n')
		.replace(/\t/g, "\\t")
		.replace(/"/g, "\\\"") + '"'
		;
}

//TODO: fix inconsistent naming
//TODO: fix that exposeAll doesn't has to be set
b('./index.js', { exposeAll : false })
.plugin(function(bundle, opts) {

	var isFirst = true;

	var stream = through.obj(function(row, enc, next) {
			var moduleString = '"' + row.id + '" : [' + createModuleJSONString(row.source) + ',' + JSON.stringify(row.deps) + ']';

			if (!isFirst) {
				moduleString = ',' + moduleString;
			} else {
				isFirst = false;
			}

			stream.push(Buffer(moduleString));
			next();
		}, function flush(){
			stream.push(Buffer('}}'));
			stream.push(null);
		}
	);

	var diffStart = ['{',
		'\t"version" : ' + version + ',',
		'\t"modules" : {',
		''
	].join('\n');

	stream.push(Buffer(diffStart));

	bundle.pipeline.get('pack').splice(0, 1, stream);
})
.bundle(function(err, buff) {
	if (err) throw err;
	console.log(JSON.stringify(JSON.parse(buff.toString()), null, 4));
	return;

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
