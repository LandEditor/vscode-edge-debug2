/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const ts = require("gulp-typescript");
const typescript = require("typescript");
const sourcemaps = require("gulp-sourcemaps");
const gulp = require("gulp");
const log = require("fancy-log");
const tslint = require("gulp-tslint");
const path = require("path");
const fs = require("fs");
const nls = require("vscode-nls-dev");
const vsce = require("vsce");
const es = require("event-stream");
const del = require("del");
const minimist = require("minimist");

const translationProjectName = "vscode-extensions";
const translationExtensionName = "vscode-edge-debug2";

const defaultLanguages = [
	{ id: "zh-tw", folderName: "cht", transifexId: "zh-hant" },
	{ id: "zh-cn", folderName: "chs", transifexId: "zh-hans" },
	{ id: "ja", folderName: "jpn" },
	{ id: "ko", folderName: "kor" },
	{ id: "de", folderName: "deu" },
	{ id: "fr", folderName: "fra" },
	{ id: "es", folderName: "esn" },
	{ id: "ru", folderName: "rus" },
	{ id: "it", folderName: "ita" },
	{ id: "cs", folderName: "csy" },
	{ id: "tr", folderName: "trk" },
	{ id: "pt-br", folderName: "ptb", transifexId: "pt-BR" },
	{ id: "pl", folderName: "plk" },
];

const watchedSources = ["src/**/*", "test/**/*"];

const scripts = ["src/launchUnelevated.js"];

const lintSources = [
	"src",
	"test",
	"!test/legacyEdge/testapp",
	"!test/legacyEdge/testdata",
].map(function (tsFolder) {
	return tsFolder + "/**/*.ts";
});

const tsProject = ts.createProject("tsconfig.json", { typescript });
function doBuild(buildNls, failOnError) {
	let gotError = false;

	const tsResult = tsProject
		.src()
		.pipe(sourcemaps.init())
		.pipe(tsProject())
		.once("error", () => {
			gotError = true;
		});

	return tsResult.js
		.pipe(buildNls ? nls.rewriteLocalizeCalls() : es.through())
		.pipe(
			buildNls
				? nls.createAdditionalLanguageFiles(
						defaultLanguages,
						"i18n",
						"out",
					)
				: es.through(),
		)
		.pipe(
			buildNls
				? nls.bundleMetaDataFiles("ms-vscode.vscode-edge-debug2", "out")
				: es.through(),
		)
		.pipe(buildNls ? nls.bundleLanguageFiles() : es.through())

		.pipe(sourcemaps.write(".", { includeContent: false, sourceRoot: "." })) // .. to compensate for TS returning paths from 'out'
		.pipe(gulp.dest("out"))
		.once("error", () => {
			gotError = true;
		})
		.once("finish", () => {
			if (failOnError && gotError) {
				process.exit(1);
			}
		});
}

gulp.task("copy-scripts", () => {
	return gulp.src(scripts, { base: "." }).pipe(gulp.dest("out"));
});

gulp.task("clean", () => {
	return del(["out/**", "debugger-for-edge-*.vsix"]);
});

gulp.task(
	"build",
	gulp.series(["clean", "copy-scripts"], () => {
		return doBuild(true, true);
	}),
);

gulp.task(
	"_dev-build",
	gulp.series(["copy-scripts"], () => {
		return doBuild(false, false);
	}),
);

gulp.task(
	"watch",
	gulp.series(["clean", "_dev-build"], () => {
		return gulp.watch(watchedSources, gulp.task("_dev-build"));
	}),
);

gulp.task("default", gulp.series("build"));

gulp.task("tslint", () => {
	return gulp
		.src(lintSources, { base: "." })
		.pipe(
			tslint({
				formatter: "verbose",
			}),
		)
		.pipe(tslint.report({ emitError: false }));
});

function verifyNotALinkedModule(modulePath) {
	return new Promise((resolve, reject) => {
		fs.lstat(modulePath, (err, stat) => {
			if (stat.isSymbolicLink()) {
				reject(new Error("Symbolic link found: " + modulePath));
			} else {
				resolve();
			}
		});
	});
}

function verifyNoLinkedModules() {
	return new Promise((resolve, reject) => {
		fs.readdir("./node_modules", (err, files) => {
			Promise.all(
				files.map((file) => {
					const modulePath = path.join(".", "node_modules", file);
					return verifyNotALinkedModule(modulePath);
				}),
			).then(resolve, reject);
		});
	});
}

gulp.task("i18n-import", function () {
	return es.merge(
		defaultLanguages.map(function (language) {
			return gulp
				.src(
					`../${translationExtensionName}-localization/${language.folderName}/**/*.xlf`,
				)
				.pipe(nls.prepareJsonFiles())
				.pipe(gulp.dest(path.join("./i18n", language.folderName)));
		}),
	);
});

gulp.task("add-i18n", function () {
	return gulp
		.src(["package.nls.json"])
		.pipe(nls.createAdditionalLanguageFiles(defaultLanguages, "i18n"))
		.pipe(gulp.dest("."));
});

gulp.task("verify-no-linked-modules", (cb) =>
	verifyNoLinkedModules().then(() => cb, cb),
);

gulp.task("vsce-publish", function () {
	return vsce.publish();
});

gulp.task("vsce-package", function () {
	const cliOptions = minimist(process.argv.slice(2));
	const packageOptions = {
		packagePath: cliOptions.packagePath,
	};

	return vsce.createVSIX(packageOptions);
});

gulp.task(
	"publish",
	gulp.series(["build", "add-i18n", "vsce-publish"], function (callback) {
		return callback();
	}),
);

gulp.task(
	"package",
	gulp.series(["build", "add-i18n", "vsce-package"], function (callback) {
		return callback();
	}),
);

gulp.task(
	"translations-export",
	gulp.series(["build"], function () {
		return gulp
			.src([
				"package.nls.json",
				"out/nls.metadata.header.json",
				"out/nls.metadata.json",
			])
			.pipe(
				nls.createXlfFiles(
					translationProjectName,
					translationExtensionName,
				),
			)
			.pipe(gulp.dest(path.join("..", "vscode-translations-export")));
	}),
);

gulp.task("translations-import", (done) => {
	const options = minimist(process.argv.slice(2), {
		string: "location",
		default: {
			location: "../vscode-translations-import",
		},
	});
	return es
		.merge(
			defaultLanguages.map((language) => {
				let id = language.transifexId || language.id;
				console.log(
					path.join(
						options.location,
						id,
						"vscode-extensions",
						`${translationExtensionName}.xlf`,
					),
				);
				return gulp
					.src(
						path.join(
							options.location,
							id,
							"vscode-extensions",
							`${translationExtensionName}.xlf`,
						),
					)
					.pipe(nls.prepareJsonFiles())
					.pipe(gulp.dest(path.join("./i18n", language.folderName)));
			}),
		)
		.on("end", () => done());
});
