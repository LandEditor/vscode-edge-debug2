/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as Core from "vscode-chrome-debug-core";

export interface ICommonRequestArgs extends Core.ICommonRequestArgs {
	webRoot?: string;

	disableNetworkCache?: boolean;

	urlFilter?: string;
}

export interface ILaunchRequestArgs
	extends Core.ILaunchRequestArgs,
		ICommonRequestArgs {
	runtimeArgs?: string[];

	runtimeExecutable?: string;

	env?: { [key: string]: string };

	cwd?: string;

	file?: string;

	url?: string;

	stopOnEntry?: boolean;

	address?: string;

	port?: number;

	userDataDir?: string;
}

export interface IAttachRequestArgs
	extends Core.IAttachRequestArgs,
		ICommonRequestArgs {}
