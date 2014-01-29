(function () {
	'use strict';

	function repeat(amount, char) {
		char = String(char).charAt(0);
		var ret = '';
		for (var i = 0; i < amount; i++) {
			ret += char;
		}
		return ret;
	}

	var common = {
		repeat: repeat
	};

	module.exports = common;

}).call();
