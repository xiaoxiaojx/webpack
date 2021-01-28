var fs = require("fs");
var path = require("path");

it("should only generate one js file", () => {
	import("./a").then(console.log);

	expect(
		fs
			.readdirSync(path.join(__dirname, "../comment-options-plugin"))
			.filter(file => file.endsWith(".js")).length
	).toBe(1);
});
