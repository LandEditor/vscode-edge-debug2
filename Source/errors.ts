/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { ErrorWithMessage } from "vscode-chrome-debug-core/out/src/errors";
import { DebugProtocol } from "vscode-debugprotocol";
import * as nls from "vscode-nls";

const localize = nls.loadMessageBundle();

/**
 * 'Path does not exist' error
 */
export function getNotExistErrorResponse(
	attribute: string,
	path: string,
): Promise<void> {
	return Promise.reject(
		new ErrorWithMessage(<DebugProtocol.Message>{
			id: 2007,
			format: localize(
				"attribute.path.not.exist",
				"Attribute '{0}' does not exist ('{1}').",
				attribute,
				"{path}",
			),
			variables: { path },
		}),
	);
}

export function incorrectFlagMessage(
	incorrectFlag: string,
	message: string,
): Promise<void> {
	return Promise.reject(
		new ErrorWithMessage(<DebugProtocol.Message>{
			id: 2007,
			format: localize(
				"incorrect.flag.usage",
				"Flag '{0}' used incorrectly. {1}.",
				incorrectFlag,
				message,
			),
			variables: { incorrectFlag },
		}),
	);
}

export { runtimeConnectionTimeout } from "vscode-chrome-debug-core/out/src/errors";
