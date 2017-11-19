/*
example:

import { generateFile, generateDir, generateTmpName } from './tmp';

generateFile({dir: '/tmp/test'}).then((r) => console.log('file', r));

generateDir({dir: '/tmp/test'}).then((r) => console.log('dir',r));

generateTmpName({dir: '/tmp/test'}).then((r) => console.log('name', r));

*/

// https://github.com/raszi/node-tmp
// npm i -S tmp
import tmp = require('tmp');

export interface TmpConfig {
	mode?: number,
	prefix?: string,
	postfix?: string,
	dir?: string,
	keep?: boolean
};

export interface TmpResponse {
	path: string,
	fd?: string,
	cleanupCallback?: Function
}

/**
 * @param {string} action - valid actions: file, dir or tmpName
 * @param {object} [options]
 * @param {number} [options.mode=0600] - the file mode to create with, it fallbacks to 0600 on file creation and 0700 on directory creation
 * @param {string} [options.prefix=Date.now()] - the optional prefix, fallbacks to tmp- if not provided
 * @param {string} [options.postfix='.tmp'] - the optional postfix, fallbacks to .tmp on file creation
 * @param {string} [options.dir=/tmp] -  the optional temporary directory, fallbacks to system default (guesses from environment)
 */
export function generate (action: string, options: TmpConfig = {}): Promise<TmpResponse> {
	return new Promise((resolve, reject) => {
        tmp[action](
			{
				prefix: Date.now(),
				tries: 10,
				...options
			},
            (error: Error, path: string, fd: string, cleanupCallback: Function): void => {
				error ? reject(error) : resolve({path, fd, cleanupCallback})
			}
        );
    });
}

export function generateFile (options?: TmpConfig): Promise<TmpResponse> {
	return generate('file', options);
}

export function generateDir (options?: TmpConfig): Promise<TmpResponse> {
	return generate('dir', options);
}

export function generateTmpName (options?: TmpConfig): Promise<TmpResponse> {
	return generate('tmpName', options);
}
