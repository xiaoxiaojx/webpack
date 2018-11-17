/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const RuntimeGlobals = require("../RuntimeGlobals");
const makeSerializable = require("../util/makeSerializable");
const NullDependency = require("./NullDependency");

/** @typedef {import("webpack-sources").ReplaceSource} ReplaceSource */
/** @typedef {import("../Dependency")} Dependency */
/** @typedef {import("../DependencyTemplate").DependencyTemplateContext} DependencyTemplateContext */

const DEFINITIONS = {
	f: [
		"var __WEBPACK_AMD_DEFINE_RESULT__;",
		`!(__WEBPACK_AMD_DEFINE_RESULT__ = (#).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))`,
		RuntimeGlobals.require,
		RuntimeGlobals.exports,
		RuntimeGlobals.module
	],
	o: ["", "!(module.exports = #)", RuntimeGlobals.module],
	of: [
		"var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;",
		`!(__WEBPACK_AMD_DEFINE_FACTORY__ = (#),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) :
		__WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))`,
		RuntimeGlobals.require,
		RuntimeGlobals.exports,
		RuntimeGlobals.module
	],
	af: [
		"var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;",
		`!(__WEBPACK_AMD_DEFINE_ARRAY__ = #, __WEBPACK_AMD_DEFINE_RESULT__ = (#).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))`,
		RuntimeGlobals.exports
	],
	ao: ["", "!(#, module.exports = #)", RuntimeGlobals.module],
	aof: [
		"var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;",
		`!(__WEBPACK_AMD_DEFINE_ARRAY__ = #, __WEBPACK_AMD_DEFINE_FACTORY__ = (#),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))`,
		RuntimeGlobals.exports,
		RuntimeGlobals.module
	],
	lf: [
		"var XXX, XXXmodule;",
		"!(XXXmodule = { id: YYY, exports: {}, loaded: false }, XXX = #.call(XXXmodule.exports, __webpack_require__, XXXmodule.exports, XXXmodule), XXXmodule.loaded = true, XXX === undefined && (XXX = XXXmodule.exports))",
		RuntimeGlobals.require
	],
	lo: ["var XXX;", "!(XXX = #)"],
	lof: [
		"var XXX, XXXfactory, XXXmodule;",
		"!(XXXfactory = (#), (typeof XXXfactory === 'function' ? (XXXmodule = { id: YYY, exports: {}, loaded: false }), (XXX = XXXfactory.call(XXXmodule.exports, __webpack_require__, XXXmodule.exports, XXXmodule)), (XXXmodule.loaded = true), XXX === undefined && (XXX = XXXmodule.exports) : XXX = XXXfactory))",
		RuntimeGlobals.require
	],
	laf: [
		"var __WEBPACK_AMD_DEFINE_ARRAY__, XXX, XXXexports;",
		"!(__WEBPACK_AMD_DEFINE_ARRAY__ = #, XXX = (#).apply(XXXexports = {}, __WEBPACK_AMD_DEFINE_ARRAY__), XXX === undefined && (XXX = XXXexports))"
	],
	lao: ["var XXX;", "!(#, XXX = #)"],
	laof: [
		"var XXXarray, XXXfactory, XXXexports, XXX;",
		`!(XXXarray = #, XXXfactory = (#),
		(typeof XXXfactory === 'function' ?
			((XXX = XXXfactory.apply(XXXexports = {}, XXXarray)), XXX === undefined && (XXX = XXXexports)) :
			(XXX = XXXfactory)
		))`
	]
};

class AMDDefineDependency extends NullDependency {
	constructor(range, arrayRange, functionRange, objectRange, namedModule) {
		super();
		this.range = range;
		this.arrayRange = arrayRange;
		this.functionRange = functionRange;
		this.objectRange = objectRange;
		this.namedModule = namedModule;
		this.localModule = null;
	}

	get type() {
		return "amd define";
	}

	serialize(context) {
		const { write } = context;
		write(this.range);
		write(this.arrayRange);
		write(this.functionRange);
		write(this.objectRange);
		write(this.namedModule);
		write(this.localModule);
		super.serialize(context);
	}

	deserialize(context) {
		const { read } = context;
		this.range = read();
		this.arrayRange = read();
		this.functionRange = read();
		this.objectRange = read();
		this.namedModule = read();
		this.localModule = read();
		super.deserialize(context);
	}
}

makeSerializable(
	AMDDefineDependency,
	"webpack/lib/dependencies/AMDDefineDependency"
);

AMDDefineDependency.Template = class AMDDefineDependencyTemplate extends NullDependency.Template {
	get definitions() {
		return;
	}

	/**
	 * @param {Dependency} dependency the dependency for which the template should be applied
	 * @param {ReplaceSource} source the current replace source which can be modified
	 * @param {DependencyTemplateContext} templateContext the context object
	 * @returns {void}
	 */
	apply(dependency, source, { runtimeRequirements }) {
		const dep = /** @type {AMDDefineDependency} */ (dependency);
		const branch = this.branch(dep);
		const defAndText = DEFINITIONS[branch];
		const definitions = defAndText[0];
		const text = defAndText[1];
		for (let i = 2; i < defAndText.length; i++) {
			runtimeRequirements.add(defAndText[i]);
		}
		this.replace(dep, source, definitions, text);
	}

	localModuleVar(dependency) {
		return (
			dependency.localModule &&
			dependency.localModule.used &&
			dependency.localModule.variableName()
		);
	}

	branch(dependency) {
		const localModuleVar = this.localModuleVar(dependency) ? "l" : "";
		const arrayRange = dependency.arrayRange ? "a" : "";
		const objectRange = dependency.objectRange ? "o" : "";
		const functionRange = dependency.functionRange ? "f" : "";
		return localModuleVar + arrayRange + objectRange + functionRange;
	}

	replace(dependency, source, definition, text) {
		const localModuleVar = this.localModuleVar(dependency);
		if (localModuleVar) {
			text = text.replace(/XXX/g, localModuleVar.replace(/\$/g, "$$$$"));
			definition = definition.replace(
				/XXX/g,
				localModuleVar.replace(/\$/g, "$$$$")
			);
		}

		if (dependency.namedModule) {
			text = text.replace(/YYY/g, JSON.stringify(dependency.namedModule));
		}

		const texts = text.split("#");

		if (definition) source.insert(0, definition);

		let current = dependency.range[0];
		if (dependency.arrayRange) {
			source.replace(current, dependency.arrayRange[0] - 1, texts.shift());
			current = dependency.arrayRange[1];
		}

		if (dependency.objectRange) {
			source.replace(current, dependency.objectRange[0] - 1, texts.shift());
			current = dependency.objectRange[1];
		} else if (dependency.functionRange) {
			source.replace(current, dependency.functionRange[0] - 1, texts.shift());
			current = dependency.functionRange[1];
		}
		source.replace(current, dependency.range[1] - 1, texts.shift());
		if (texts.length > 0) throw new Error("Implementation error");
	}
};

module.exports = AMDDefineDependency;
