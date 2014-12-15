var bundleDiff = require('browserify-json-bundle-diff');
var _ = require('lodash');

function DiffGenerator(changesets) {
	this._changesets = _.indexBy(changesets, "from");
	//If there are no changesets then the getDiffSince function should always return null.
	if (!changesets.length) {
		this._getDiffSince = function getDiffSince() {
			return null;
		};
		return;
	}
	this._latestVersion = changesets[changesets.length - 1].to;

	this._getDiffSince = _.memoize(function getDiffSince(version) {
		//No diff if we're already latest
		if (version === this._latestVersion) {
			return null;
		}
		//recursively apply the diffs
		var head = this._changesets[version];
		var tail = head && this.getDiffSince(head.to);
		if (tail) {
			return bundleDiff.merge(head, tail);
		} else {
			return head;
		}
	}.bind(this));
}
DiffGenerator.prototype.getDiffSince = function getDiffSince(version) {
	return this._getDiffSince(version);
};

module.exports = DiffGenerator;
