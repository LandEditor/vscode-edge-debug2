/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as os from "os";
import * as path from "path";
import {
	BaseSourceMapTransformer,
	ChromeDebugSession,
	UrlPathTransformer,
	logger,
	telemetry,
} from "vscode-chrome-debug-core";
import { targetFilter } from "./utils";

import { EdgeDebugAdapter } from "./edgeDebugAdapter";

const EXTENSION_NAME = "debugger-for-edge";

// Start a ChromeDebugSession configured to only match 'page' targets, which are Chrome tabs.
// Cast because DebugSession is declared twice - in this repo's vscode-debugadapter, and that of -core... TODO
ChromeDebugSession.run(
	ChromeDebugSession.getSession({
		adapter: EdgeDebugAdapter,
		extensionName: EXTENSION_NAME,
		logFilePath: path.resolve(os.tmpdir(), "vscode-edge-debug.txt"),
		targetFilter,

		pathTransformer: UrlPathTransformer,
		sourceMapTransformer: BaseSourceMapTransformer,
	}),
);

/* tslint:disable:no-var-requires */
const debugAdapterVersion = require("../../../package.json").version;
logger.log(EXTENSION_NAME + ": " + debugAdapterVersion);
telemetry.telemetry.addCustomGlobalProperty({
	"Versions.DebugAdapter": debugAdapterVersion,
});
