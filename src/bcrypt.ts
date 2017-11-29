// just a wrapper for compatibility in case bcrypt-nodejs needs to be replaced

/*
Example

import { encrypt, verify } from './bcrypt';
const password = 'abc123';
encrypt(password).then((hash) => {
    verify(password, hash).then(console.log);

    verify(password, 'invalidhash').then(console.log, console.error);

    verify('invalidpass', hash).then(console.log);
});
*/

import { compare, hash } from 'bcrypt-nodejs';

/**
 * @param {string} value - string to encrypt
 * @return {promise}
 */
export function encrypt (value: string): Promise<string> {
    return new Promise(
        (resolve, reject) => hash(
            value, null, null, (error, hashedString) => error ? reject(error) : resolve(hashedString)
        )
    );
}

/**
 * @param {string} value - string to check
 * @param {string} hashedString - encrypted hash
 * @return {promise}
 */
export function verify (value: string, hashedString: string): Promise<boolean> {
    return new Promise(
        (resolve, reject) => compare(
            value, hashedString, (error, result) => error ? reject(error) : resolve(result)
        )
    );
}
