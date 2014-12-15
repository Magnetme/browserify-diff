var express = require('express');
var fs = require('fs');
var path = require('path');
var browserifyDiff = require('..');

var changesetDir = __dirname + '/changesets';

//First we're going to construct the current latest build based on the changesets already present
//We could optimize this by caching full builds somewhere, but for the sake of the exapmle we're
//not doing that
var changesetFiles = fs.readdirSync(changesetDir);
var changesets = changesetFiles.map(function(filename) {
	return JSON.parse(fs.readFileSync(path.resolve(changesetDir, filename), "utf8"));
});
var diffGenerator = new browserifyDiff.Generator(changesets);


var app = express();
app.use(express.static(__dirname));

app.get('/diff', function(req, res, next) {
	var baseVersion = Number(req.query.since);
	var diff = diffGenerator.getDiffSince(baseVersion);
	if (diff) {
		res.setHeader('Content-Type', 'application/json');
		res.json(diff);
	} else {
		res.status(204);
	}
	res.end();
});

app.listen(8000);
