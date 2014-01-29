/*jshint -W098*/

describe('basics', function () {
	'use strict';

	var path = require('path');

	var helper = require('../helper');
	var assert = helper.assert;

	var pleonasm = require('../../lib/index');

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	it('is defined', function () {
		assert.ok(pleonasm);
	});
	var tests = {
		'aaa': 'annex near',
		'70a505': 'turn purpose',
		'17b2aa': 'lost broken ones'
	};

	describe('sync', function () {
		var api;
		before(function (done) {
			pleonasm.loadAPI(null, function (err, loadAPi) {
				api = loadAPi;
				done(err);
			});
		});
		after(function () {
			api = null;
		});
		Object.keys(tests).forEach(function (input) {
			var expected = tests[input];
			it('"' + input + '" = "' + expected + '"', function () {
				var encode = api.encode(input).code;
				assert.strictEqual(encode, expected, 'encode');

				var decode = api.decode(encode).hex;
				assert.strictEqual(decode, input, 'encode');
			});
		});
	});

	describe('async-check', function () {
		var api;
		before(function () {
			api = pleonasm.loadAPI();
		});
		after(function () {
			api = null;
		});
		Object.keys(tests).forEach(function (input) {
			var expected = tests[input];
			it('"' + input + '" = "' + expected + '"', function (done) {
				api.loaded(function (err) {
					if (err) {
						done(err);
						return;
					}
					var encode = api.encode(input).code;
					assert.strictEqual(encode, expected, 'encode');

					var decode = api.decode(encode).hex;
					assert.strictEqual(decode, input, 'encode');
					done();
				});
			});
		});
	});

	describe('async', function () {
		Object.keys(tests).forEach(function (input) {
			var expected = tests[input];
			it('"' + input + '" = "' + expected + '"', function (done) {
				var api = pleonasm.getAsyncAPI({
					lazy:true
				});
				api.encode(input, null, null, function (err, res) {
					if (err) {
						done(err);
						return;
					}
					var encode = res.code;
					assert.strictEqual(encode, expected, 'encode');

					api.decode(encode, function (err, res) {
						if (err) {
							done(err);
							return;
						}
						var decode = res.hex;
						assert.strictEqual(decode, input, 'encode');
						done();
					});
				});
			});
		});
	});
});
