Module to allow browserify bundle caching and fast minimal cache updates based on version diffs.

[Quickstart example](#Examples)

The goal of this project is to allow intelligent caching for browserify bundles. With regular browserify bundles you don't have many options for caching of individual modules: when one module changes the entire build will change and thus is required to be fetched entirely. This is very inefficient, especially when you have a large bundle and release often, like we do at Magnet.me. This project provides the necessary tools to enable caching of individual modules without having to fetch all modules individually.

The core of this tool is a new bundle format: the browserify-json-bundle. The browserify plugin bundled in this module changes the output format of a browserify bundle into this browserify-json-bundle format, and additionally can generate a diff with the previous export. The embedded module loader will load a full bundle the first time it is executed. On successive calls, usually on successive page loads, it will only fetch a patch and apply it to the cached bundle (if possible). A tool is also embedded to generate stack all diffs since a specified version, such that only one diff needs to be send (more isn't requested either).

This module provides:
- A browserify plugin that will generate browserify-json-bundles and bundle diffs.
- A bundle loader that can load a browserify-json-bundle and fetch and apply patches.
- A tool that can generate a diff from a base version to latest.
- A set of browserify option overrides.<sup>1</sup>

Sourcemaps are at the moment of writing not yet properly supported. They might accidentally work, but We're working on it.


## Examples
In your build chain:

```javascript
var browserify = require('browserify');
var browserifyDiff = require('browserify-diff');
var fs = require('fs');

//Required!!!
var options = browserifyDiff.wrapOptions(myBrowserifyOptions);

var version = getNextVersion(); //e.g. git tag, date, semver, etc.

browserify('app.js', options)
	.plugin(browserifyDiff.plugin, {
		version : version,
		diffPath : 'diff_' + version + 'json'
	})
	.bundle()
	.pipe(fs.createWriteStream('full.js'));
```

In your back-end (NodeJS-express example) <sup>2</sup>:
```javascript
var browserifyDiff = require('browserify-diff');
var diffs = loadAllDiffs(); //Should return an array of diffs. The diffs generated above can be used directly.
var express = require('express');

var app = express();

//resource for full version is trivial and thus not included here

app.get('diff', function(req, res) {
	var baseVersion = req.query.since;
	var diff = browserifyDiff.getDiffSince({
		diffs : diffs
	}, baseVersion);
	res.json(diff);
	res.end();
});

```

In your front-end code:
```html
<!DOCTYPE html>
<html>
	<head>
		<script src="/node_modules/browserify-diff/bundleLoader.js"></script>
		<script>
			bundleLoader({
				sourceUrl  : 'full.js',
				diffUrl    : 'diff?since=%v'
			});
		</script>
	</head>
</html>
```


## Remarks
1. The plugin architecture of browserify unfortunately does not give full control: the options are already passed to the sub components *before* the plugins are called. This makes it impossible to override the options from the plugin. Therefore the user (unfortunately) has to do that manually.
2. If you don't have a NodeJS application you should provide your own implementation of a diff merger, since only one diff is requested at a time. The merger embedded in this module (from the [browserify-json-bundle-diff](https://github.com/Magnetme/browserify-json-bundle-diff)) does only require a CommonJS environment, not necessarily NodeJS. It can thus be used in any environment that supports CommonJS modules. E.g. At Magnet.me we're going to use Java's Nashorn implementation with [jvm-npm](https://github.com/nodyn/jvm-npm) to run the merger inside the JVM.
