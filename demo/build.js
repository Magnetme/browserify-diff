#!/usr/bin/env node
var browserify = require('browserify');
var browserifyDiff = require('..');
var fs = require('fs');
var path = require('path');
process.chdir(__dirname);

var changesetDir = __dirname + '/changesets';
var outFile = __dirname + '/bundles/latest.json';

//First we're going to construct the current latest build based on the changesets already present
//We could optimize this by caching full builds somewhere, but for the sake of the exapmle we're
//not doing that
var changesetFiles = fs.readdirSync(changesetDir);
var changesets = changesetFiles.map(function(filename) {
	return JSON.parse(fs.readFileSync(path.resolve(changesetDir, filename), "utf8"));
});
var diffGenerator = new browserifyDiff.Generator(changesets);
var latest = diffGenerator.getDiffSince(null);

//We now have the latest changeset, but a changeset has a slightly different format than a full build
//Most notably, a changeset has a "from" and a "to" property, whereas a full build needs a "version"
//property. We simply transform the changeset into a full build by setting the version property to
//the "to" field of the changeset
if (latest) {
	latest.version = latest.to;
}

var nextVersion = latest ? latest.version + 1 : 1;

browserify('./index.js', browserifyDiff.browserifyOptions)
	.plugin(browserifyDiff.plugin, {
		version : nextVersion,
		previousBuild : latest,
		changesetFile : changesetDir + "/changeset_" + nextVersion + ".json"
	})
	.bundle()
	.pipe(fs.createWriteStream(outFile));
