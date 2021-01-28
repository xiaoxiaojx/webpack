var IgnoreImportWebpackPlugin = require("./plugin");

/** @type {import("../../../../").Configuration} */
module.exports = {
	plugins: [new IgnoreImportWebpackPlugin()],
	node: {
		__dirname: false
	}
};
