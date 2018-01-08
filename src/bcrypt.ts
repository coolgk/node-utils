/***
description: just a wrapper for bcrypt-nodejs
keywords:
    - bcrypt
dependencies:
    "@types/bcrypt-nodejs": "0.0.30"
    "bcrypt-nodejs": "0.0.3"
example: |
    import { encrypt, verify } from '@coolgk/bcrypt';

    const password = 'abc123';

    encrypt(password).then((hash) => {
        verify(password, hash).then(console.log); // true
        verify(password, 'invalidhash').then(console.log, console.error); // Not a valid BCrypt hash.
        verify('invalidpass', hash).then(console.log); // false
    });
documentation: |
    #### encrypt (value, salt = null)
    - Parameters
        - {string} value - string to encrypt
        - {string} salt - salt
    - Return Value
        - promise<string>

    #### verify (value, hashedString)
    - Parameters
        - {string} value - string to check
        - {string} hashedString - encrypted hash
    - Return Value
        - promise<boolean>
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
            value, salt, () => null, (error, hashedString) => error ? reject(error) : resolve(hashedString)
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
            value, hashedString, (error, result) => error ? reject(error) : resolve(result)
        )
    );
}
