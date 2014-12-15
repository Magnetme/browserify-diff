var bundlerPlugin = require('browserify-json-bundler');
var bundleDiff = require('browserify-json-bundle-diff');
var fs = require('fs');
var _ = require('lodash');
var DiffGenerator = require('./DiffGenerator');

var emptyDiff = {};

var browserifyDiff;
module.exports = browserifyDiff = {
	browserifyOptions : {
		exposeAll : true
	},
	wrapOptions : function(options) {
		return _.extend(options, browserifyDiff.browserifyOptions);
	},
	plugin : function(b, opts) {
		//1. Attach the bundler plugin
		b.plugin(bundlerPlugin, opts);

		//2. Hook into the bundle event to create a changeset (if possible)
		if (opts.changesetFile) {
			b.on('bundle', function(stream) {
				var bundleString = '';
				stream.on('data', function(data) {
					bundleString += data;
				});
				stream.on('end', function() {
					var bundle = JSON.parse(bundleString);
					var diff;
					if (opts.previousBuild) {
						diff = bundleDiff.create(opts.previousBuild, bundle);
					} else {
						//If there's no previous version we simply transform the entire build into a changeset
						diff = bundle;
						diff.to = diff.version;
						diff.from = null;
						delete diff.version;
					}
					//fire and forget
					fs.writeFile(opts.changesetFile, JSON.stringify(diff), "utf8");
				});
			});
		}
	},
	Generator : DiffGenerator
};
