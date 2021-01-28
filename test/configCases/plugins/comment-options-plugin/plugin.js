module.exports = class IgnoreImportWebpackPlugin {
	apply(compiler) {
		compiler.hooks.compilation.tap(
			IgnoreImportWebpackPlugin.name,
			(compilation, { normalModuleFactory }) => {
				const handleHooksParser = (parser, parserOptions) => {
					if (parserOptions.import !== undefined && !parserOptions.import)
						return;

					/** @type {SyncBailHook<expression>} */
					parser.hooks.commentOptions.tap(
						IgnoreImportWebpackPlugin.name,
						(options, expr) => {
                            options = options || {}
							options.webpackMode = "eager";
                            return options
						}
					);
				};

				/** @type {SyncHook<parser, parserOptions>} */
				normalModuleFactory.hooks.parser
					.for("javascript/auto")
					.tap(IgnoreImportWebpackPlugin.name, handleHooksParser);
				normalModuleFactory.hooks.parser
					.for("javascript/dynamic")
					.tap(IgnoreImportWebpackPlugin.name, handleHooksParser);
				normalModuleFactory.hooks.parser
					.for("javascript/esm")
					.tap(IgnoreImportWebpackPlugin.name, handleHooksParser);
			}
		);
	}
}
