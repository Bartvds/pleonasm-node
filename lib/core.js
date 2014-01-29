/*jshint -W098*/

(function () {
	'use strict';

	var fs = require('fs');
	var path = require('path');
	var split = require('split');

	var lib = require('./lib');

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	var hex_alphabet = '0123456789abcdef';
	var trsl_alphabet = 'ulkmhpvtwgnbcdyf';

	var hex_re = new RegExp('[^' + hex_alphabet + ']', 'g');
	var trsl_re = new RegExp('[^' + trsl_alphabet + ']', 'g');

	var treeIDs = ['verb', 'adj', 'noun'];

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	function translate_from_hex(hex) {
		for (var i = 0; i < 16; i++) {
			hex = hex.replace(new RegExp(hex_alphabet[i], 'g'), trsl_alphabet[i]);
		}
		return hex;
	}

	function translate_to_hex(code) {
		for (var i = 0; i < 16; i++) {
			code = code.replace(new RegExp(trsl_alphabet[i], 'g'), hex_alphabet[i]);
		}
		return code;
	}

	function find_longest(tree, word) {

		var depth = 0;
		var longest_match = null;

		for (var i = 0; i <= word.length; i++) {
			var sub_path = word.substring(0, i);
			if (sub_path in tree) {
				var match = tree[sub_path];
				if (match !== null) {
					depth = i;
					longest_match = match;
				}
			} else {
				break;
			}
		}
		return {depth: depth, match: longest_match};
	}

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	function format(codeWords, wordDelimiter, groupDelimiter) {
		var groups = [];
		var groupSize = treeIDs.length;
		for (var i = 0; i < Math.ceil(codeWords.length / groupSize); i++) {
			var subGroup = codeWords.slice(i * groupSize, (i * groupSize) + groupSize);
			groups.push(subGroup.join(wordDelimiter));
		}
		return groups.join(groupDelimiter);
	}

	function decode(code) {
		var removed_redundancy = code.replace(trsl_re, '');
		var spaced = code.replace(trsl_re, ' ');
		var hex = translate_to_hex(removed_redundancy);
		return {hex: hex, spaced: spaced, translation: removed_redundancy};
	}

	function getAPI(dicts) {

		function encode(hex, wordDelimiter, groupDelimiter) {

			if (typeof wordDelimiter !== 'string') {
				wordDelimiter = ' ';
			}
			if (typeof groupDelimiter !== 'string') {
				groupDelimiter = ', ';
			}

			var result = {};

			var hex_lower = hex.toLowerCase();
			var filtered = hex_lower.replace(hex_re, '');
			var translated = translate_from_hex(filtered);

			result.translation = translated;

			var treeIndex = 0;
			var codeWords = [];

			while (translated.length > 0) {

				// verb, adj, noun, verb, adj, noun, ...
				var tree = dicts[treeIDs[treeIndex % treeIDs.length]];

				var longest = find_longest(tree, translated);
				translated = translated.substring(longest.depth);

				codeWords.push(longest.match);

				treeIndex++;
			}

			result.codeWords = codeWords;
			result.code = format(codeWords, wordDelimiter, groupDelimiter);
			result.spaced = result.code.replace(trsl_re, ' ');

			return result;
		}

		return {
			encode: encode,
			decode: decode,
			format: format
		};
	}

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	function loadDict(opts, callback) {
		opts = opts || {};

		var srcs = opts.srcs || {};
		srcs.verb = srcs.verb || 'verb.txt';
		srcs.adj = srcs.adj || 'adj.txt';
		srcs.noun = srcs.noun || 'noun.txt';

		var basedir = opts.basedir || path.resolve(path.dirname(module.filename), '..', 'dictionaries');

		var dicts = opts.dicts || Object.create(null);

		var queue = Object.keys(srcs);

		queue.forEach(function (key) {
			var tree = dicts[key] = Object.create(null);

			fs.createReadStream(path.join(basedir, srcs[key]), {
				encoding: 'utf8'
			}).pipe(split()).on('data',function (line) {
				//each chunk now is a seperate line!

				var filtered_line = line.replace(trsl_re, '');

				// create empty nodes on the way to the key
				// e.g. b = null, bc = null when inserting bcd = braced
				// --> to know when to stop the lookup
				for (var j = 0; j < filtered_line.length; j++) {
					var sub_path = filtered_line.substring(0, j);
					if (!(sub_path in tree)) {
						tree[sub_path] = null;
					}
				}
				// actual lookup table
				tree[filtered_line] = line;

			}).on('error',function (err) {
				if (queue) {
					queue = null;
					callback(err);
				}
			}).on('close', function () {
				if (queue) {
					var i = queue.indexOf(key);
					if (i > -1) {
						queue.splice(i, 1);
					}
					if (queue.length === 0) {
						queue = null;
						callback(null, dicts);
					}
				}
			});
		});
	}

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	module.exports = {
		loadDict: loadDict,
		getAPI: getAPI,
		decode: decode
	};

}).call();
