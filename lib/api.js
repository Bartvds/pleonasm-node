/*jshint -W098*/

(function () {
	'use strict';

	var fs = require('fs');
	var path = require('path');
	var split = require('split');

	var core = require('./core');

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	// standard async init
	function loadAPI(opts, callback) {
		opts = opts || {};

		var dicts = opts.dicts = Object.create(null);
		var api = core.getAPI(dicts, opts.wordDelimiter, opts.groupDelimiter);

		var loaded;
		var loadedErr;
		var queue = [];

		api.loaded = function (callback) {
			if (queue) {
				queue.push(callback);
				return;
			}
			process.nextTick(function () {
				callback(loadedErr, api);
			});
		};
		core.loadDict(opts, function (err) {
			loaded = true;
			loadedErr = err;
			queue.forEach(function (callback) {
				callback(err, api);
			});
			queue = null;
			if (callback) {
				callback(err, api);
			}
		});
		return api;
	}

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	// support lazy loading
	function getAsyncAPI(opts) {
		opts = opts || {};

		var dicts = opts.dicts = Object.create(null);
		var api = core.getAPI(dicts, opts.wordDelimiter, opts.groupDelimiter);

		var queue;

		var stub = {
			encode: function encode(hex, wordDelimiter, groupDelimiter, callback) {
				call({
					callback: callback,
					action: 'encode',
					args: arguments
				});
			},
			decode: function decode(code, callback) {
				var ret = api.decode(code);
				if (callback) {
					process.nextTick(function () {
						callback(null, ret);
					});
				}
				return ret;
			},
			format: function format(hex, wordDelimiter, groupDelimiter, callback) {
				var ret = api.encode(hex, wordDelimiter, groupDelimiter);
				if (callback) {
					process.nextTick(function () {
						callback(null, ret);
					});
				}
				return ret;
			}
		};

		function call(params) {
			load();
			queue.push(params);
		}

		function load() {
			if (!queue) {
				queue = [];
				core.loadDict(opts, function (err) {
					if (err) {
						queue.forEach(function (item) {
							item.callback(err);
						});
						return;
					}
					// replace dummy
					stub.encode = function encode(hex, wordDelimiter, groupDelimiter, callback) {
						process.nextTick(function () {
							callback(null, api.encode(hex, wordDelimiter, groupDelimiter));
						});
					};
					queue.forEach(function (item) {
						stub[item.action].apply(null, item.args);
					});
				});
			}
		}

		if (!opts.lazy) {
			load();
		}
		return stub;
	}

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	module.exports = {
		loadAPI: loadAPI,
		getAsyncAPI: getAsyncAPI
	};

}).call();
