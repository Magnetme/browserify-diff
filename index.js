//General todo:
//- Add bjb-loader as dependency
//- Symlink minified script to root directory, such that it can be directly required/copied from this module
//- Add README.md
var browserifyDiff;
module.exports = browserifyDiff = {
	optionOverrides : {
		exposeAll : true
	},
	wrapOptions : function(options) {
		return _.extend(options, browserifyDiff.optionOverrides);
	},
	plugin : function(b, opts) {
		//TODO:
		//- attaching browserify-json-bundler as plugin
		//- Optionally generating diffs based on the previous compiled version
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
