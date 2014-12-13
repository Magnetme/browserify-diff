/**
 * Module loader script.
 * This is a wrapper around the browserify-prelude function with support for intelligent updating of scripts.
 * It keeps track of the version already downloaded to the user's pc (localstorage) and explicitely
 * requests the server for a changeset. It will then update it's module cache with the changes.
 */
//TODO: cleaner (de)serialization
function turboloader(opts, modules, cache, entry) {

	//--START IMPORT PRELUDE-- TODO: don't copy-paste
	// Save the require from previous bundle to this closure if any
	function outer (modules, cache, entry) {
		var previousRequire = typeof require == "function" && require;
		function newRequire(name, jumped){
			if(!cache[name]) {
				if(!modules[name]) {
					// if we cannot find the the module within our internal map or
					// cache jump to the current global require ie. the last bundle
					// that was added to the page.
					var currentRequire = typeof require == "function" && require;
					if (!jumped && currentRequire) return currentRequire(name, true);
					// If there are other bundles on this page the require from the
					// previous one is saved to 'previousRequire'. Repeat this as
					// many times as there are bundles until the module is found or
					// we exhaust the require chain.
					if (previousRequire) return previousRequire(name, true);
					throw new Error('Cannot find module \'' + name + '\'');
				}
				var m = cache[name] = {exports:{}};
				modules[name][0].call(m.exports, function(x){
					var id = modules[name][1][x];
					return newRequire(id ? id : x);
				},m,m.exports,outer,modules,cache,entry);
			}
			return cache[name].exports;
		}
		for(var i=0;i<entry.length;i++) newRequire(entry[i]);
	}
	//---END IMPORT PRELUDE---

	opts.storage = opts.storage || window.localStorage;
	opts.version = Number(opts.storage.getItem('__v') || opts.version);
	var storedModules = opts.storage.getItem('__modules');
	if (storedModules) {
		modules = JSON.parse(storedModules);
		for (var moduleName in modules) {
			var functionString = modules[moduleName][0];
			modules[moduleName][0] = eval('(' + functionString + ')');
		}
	}

	function createModuleFunction(moduleString, fileName) {
		fileName = window.location.href + fileName;
		fileName = fileName.replace(/\/+/g, '/');
		var expression = ["(function(require,module,exports){",
			"",
			moduleString,
			"",
			"})",
			"\/\/# sourceURL=" + fileName
		].join('\n');
		return eval(expression);
	}


	//Do a request for the changeset
	var url = opts.replacements.replace('%v', opts.version);
	var feyenoord = new XMLHttpRequest();
	feyenoord.addEventListener('readystatechange', function() {
		if (feyenoord.readyState === 4) {
			if (feyenoord.status === 200) {
				var diff = JSON.parse(feyenoord.responseText);
				if (!opts.alwaysReplace && diff.version === opts.version) {
					console.log('Already having the most up to date version');
				} else {
					for (var moduleName in diff.modules) {
						var module = diff.modules[moduleName];
						var moduleFunction = createModuleFunction(module[0], moduleName);
						var mDeps = module[1];
						modules[moduleName] = [
							moduleFunction,
							mDeps
						];
					}
					opts.storage.setItem('__v', diff.version);
					opts.storage.setItem('__modules', JSON.stringify(modules, function serializer(key, value) {
						if (typeof value === 'function') {
							return value.toString();
						}
						return value;
					}));
				}
				outer(modules, cache, entry);
			}
		}
	});
	feyenoord.open('GET', url, true);
	feyenoord.send();

}

//Returns a ready made prelude function.
module.exports.createPrelude = function(opts) {
	return '(' + turboloader.toString() + '.bind(null, ' + JSON.stringify(opts) + '))';
};
