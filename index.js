var bundlerPlugin = require('browserify-json-bundler');
var bundleDiff = require('browserify-json-bundle-diff');
var fs = require('fs');

//General todo:
//- Add bjb-loader as dependency
//- Symlink minified script to root directory, such that it can be directly required/copied from this module
//- Add README.md
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

		//2. Hook into the bundle event to create diffs when requested
		if (opts.diffFile && opts.previousBuild) {
			b.on('bundle', function(stream) {
				var bundleString = '';
				stream.on('data', function(data) {
					bundleString += data;
				});
				stream.on('end', function() {
					var bundle = JSON.parse(bundleString);
					var diff = bundleDiff.create(opts.previousBuild, bundle);
					//fire and forget
					fs.writeFile(opts.diffFile, JSON.stringify(diff), "utf8");
				});
			});
		}
	},
	getDiffSince : function(opts, version) {
		//TODO:
		//- Find all diffs since version
		//- Merge diffs using browserify-json-bundle-diff
		//- Return
	},
	/* TODO: express middleware (for the future)
	express : function() {},
	*/
};
