/***
description: wrapper functions, generate tmp file or folders
version: 2.0.4
keywords:
    - temp
    - tmp
dependencies:
    "tmp": "0.0.33"
    "@types/tmp": "0.0.33"
example: |
    import { generateFile, generateDir, generateTmpName } from '@coolgk/tmp';
    // OR
    // const { generateFile, generateDir, generateTmpName } = require('@coolgk/tmp');

    generateFile({dir: '/tmp/test'}).then((r) => console.log('file', r));
        // file { path: '/tmp/test/1512307052908140480ZZj6J0LOIJb.tmp' }

    generateDir({dir: '/tmp/test'}).then((r) => console.log('dir',r));
        // dir { path: '/tmp/test/1512307052918140484Pnv1m95ZS2b' }

    generateTmpName({dir: '/tmp/test'}).then((r) => console.log('name', r));
        // name { path: '/tmp/test/151230705292114048hb3XIds0FO9Y' }
*/

// https://github.com/raszi/node-tmp
// npm i -S tmp
import { file, dir, tmpName } from 'tmp';

export interface ITmpConfig {
    mode?: number;
    prefix?: string;
    postfix?: string;
    dir?: string;
    keep?: boolean;
}

export interface ITmpFileResponse {
    path: string;
    fd: string;
    cleanupCallback: () => void;
}

export interface ITmpDirResponse {
    path: string;
    cleanupCallback: () => void;
}

export interface ITmpNameResponse {
    path: string;
}

/**
 * @param {object} [options]
 * @param {number} [options.mode=0600] - the file mode to create with, defaults to 0600 on file and 0700 on directory
 * @param {string} [options.prefix=Date.now()] - the optional prefix, fallbacks to tmp- if not provided
 * @param {string} [options.postfix='.tmp'] - the optional postfix, fallbacks to .tmp on file creation
 * @param {string} [options.dir=/tmp] -  the optional temporary directory, fallbacks to system default
 * @param {boolean} [options.keep=false] - if to keep the file
 * @return {promise} - { path: ..., cleanupCallback: ... } calling cleanupCallback() removes the generated file
 */
export function generateFile (options?: ITmpConfig): Promise<ITmpFileResponse> {
    return generate('file', options) as Promise<ITmpFileResponse>;
}

/**
 * @param {object} [options]
 * @param {number} [options.mode=0600] - the file mode to create with, defaults to 0600 on file and 0700 on directory
 * @param {string} [options.prefix=Date.now()] - the optional prefix, fallbacks to tmp- if not provided
 * @param {string} [options.postfix='.tmp'] - the optional postfix, fallbacks to .tmp on file creation
 * @param {string} [options.dir=/tmp] -  the optional temporary directory, fallbacks to system default
 * @param {boolean} [options.keep=false] - if to keep the file
 * @return {promise} - { path: ..., cleanupCallback: ... } calling cleanupCallback() removes the generated file
 */
export function generateDir (options?: ITmpConfig): Promise<ITmpDirResponse> {
    return generate('dir', options) as Promise<ITmpDirResponse>;
}

/**
 * @param {object} [options]
 * @param {number} [options.mode=0600] - the file mode to create with, defaults to 0600 on file and 0700 on directory
 * @param {string} [options.prefix=Date.now()] - the optional prefix, fallbacks to tmp- if not provided
 * @param {string} [options.postfix='.tmp'] - the optional postfix, fallbacks to .tmp on file creation
 * @param {string} [options.dir=/tmp] -  the optional temporary directory, fallbacks to system default
 * @return {promise} - { path: ... }
 */
export function generateTmpName (options?: ITmpConfig): Promise<ITmpNameResponse> {
    return generate('tmpName', options) as Promise<ITmpNameResponse>;
}

/**
 * @param {string} action - valid actions: file, dir or tmpName
 * @param {object} [options]
 * @param {number} [options.mode=0600] - the file mode to create with, defaults to 0600 on file and 0700 on directory
 * @param {string} [options.prefix=Date.now()] - the optional prefix
 * @param {string} [options.postfix='.tmp'] - the optional postfix
 * @param {string} [options.dir=os.tmpdir()] - the optional temporary directory, fallbacks to system default
 * @param {boolean} [options.keep=false] - if to keep the file
 * @return {promise}
 * @ignore
 */
export function generate (action: string, options: ITmpConfig = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!options.prefix) {
            options.prefix = Date.now() + '';
        }
        const actions: { [index: string]: any } = { file, dir, tmpName };
        actions[action](
            {
                tries: 10,
                ...options
            },
            (error: Error, path: string, fd?: string, cleanupCallback?: () => void): void => {
                return error ? reject(error) : resolve({path, fd, cleanupCallback});
            }
        );
    });
}
