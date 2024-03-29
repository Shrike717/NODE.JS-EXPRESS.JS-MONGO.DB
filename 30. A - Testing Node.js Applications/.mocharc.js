const { colors, symbols } = require("mocha/lib/reporters/base");
colors.pass = 32;
symbols.ok = "👍";

// Configuration example from Mocha repo
module.exports = {
	diff: true,
	extension: ["js"],
	package: "./package.json",
	reporter: "spec",
	slow: 75,
	timeout: 2000,
	ui: "bdd",
	"watch-files": ["lib/**/*.js", "test/**/*.js"],
	"watch-ignore": ["lib/vendor"],
};
