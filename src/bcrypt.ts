/***
description: just a promise wrapper
version: 2.0.6
keywords:
    - bcrypt
dependencies:
    "@types/bcrypt-nodejs": "0.0.30"
    "bcrypt-nodejs": "0.0.3"
example: |
    import { encrypt, verify } from '@coolgk/bcrypt';
    // OR
    // const { encrypt, verify } = require('@coolgk/bcrypt');

    const password = 'abc123';

    encrypt(password).then((hash) => {
        verify(password, hash).then(console.log); // true
        verify(password, 'invalidhash').then(console.log, console.error); // Not a valid BCrypt hash.
        verify('invalidpass', hash).then(console.log); // false
    });
*/

/*!
 *  Copyright (c) 2017 Daniel Gong <daniel.k.gong@gmail.com>. All rights reserved.
 *  Licensed under the MIT License.
 */

// just a wrapper for compatibility in case bcrypt-nodejs needs to be replaced

import { compare, hash } from 'bcrypt-nodejs';

/**
 * @param {string} value - string to encrypt
 * @param {string} salt - salt
 * @return {promise<string>}
 */
export function encrypt (value: string, salt: string = ''): Promise<string> {
    return new Promise(
        (resolve, reject) => hash(
            String(value), salt, () => null, (error, hashedString) => error ? reject(error) : resolve(hashedString)
        )
    );
}

/**
 * @param {string} value - string to check
 * @param {string} hashedString - encrypted hash
 * @return {promise<boolean>}
 */
export function verify (value: string, hashedString: string): Promise<boolean> {
    return new Promise(
        (resolve, reject) => compare(
            String(value), String(hashedString), (error, result) => error ? reject(error) : resolve(result)
        )
    );
}
