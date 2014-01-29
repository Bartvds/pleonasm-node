(function () {
	'use strict';

	// assemble exports

	var core = require('./core');
	var api = require('./api');

	module.exports = {
		loadDict: core.loadDict,
		getAPI: core.getAPI,
		decode: core.decode,
		loadAPI: api.loadAPI,
		getAsyncAPI: api.getAsyncAPI
	};

}).call();
