// https://github.com/raszi/node-tmp
// npm i -S tmp
import tmp = require('tmp');

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
 * @param {string} action - valid actions: file, dir or tmpName
 * @param {object} [options]
 * @param {number} [options.mode=0600] - the file mode to create with, defaults to 0600 on file and 0700 on directory
 * @param {string} [options.prefix=Date.now()] - the optional prefix
 * @param {string} [options.postfix='.tmp'] - the optional postfix
 * @param {string} [options.dir=os.tmpdir()] - the optional temporary directory, fallbacks to system default
 * @param {boolean} [options.keep] - if to keep the file
 * @return {promise}
 */
export function generate (action: string, options: ITmpConfig = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        tmp[action](
            {
                prefix: Date.now(),
                tries: 10,
                ...options
            },
            (error: Error, path: string, fd?: string, cleanupCallback?: () => void): void => {
                return error ? reject(error) : resolve({path, fd, cleanupCallback});
            }
        );
    });
}

/**
 * @param {object} [options]
 * @param {number} [options.mode=0600] - the file mode to create with, defaults to 0600 on file and 0700 on directory
 * @param {string} [options.prefix=Date.now()] - the optional prefix, fallbacks to tmp- if not provided
 * @param {string} [options.postfix='.tmp'] - the optional postfix, fallbacks to .tmp on file creation
 * @param {string} [options.dir=/tmp] -  the optional temporary directory, fallbacks to system default
 * @param {boolean} [options.keep] - if to keep the file
 * @return {promise}
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
 * @param {boolean} [options.keep] - if to keep the file
 * @return {promise}
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
 * @return {promise}
 */
export function generateTmpName (options?: ITmpConfig): Promise<ITmpNameResponse> {
    return generate('tmpName', options) as Promise<ITmpNameResponse>;
}
