// just a wrapper for compatibility in case bcrypt-nodejs needs to be replaced

import { compare, hash } from 'bcrypt-nodejs';

/**
 * @param {string} value - string to encrypt
 * @param {string} salt - salt
 * @return {promise}
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
 * @return {promise}
 */
export function verify (value: string, hashedString: string): Promise<boolean> {
    return new Promise(
        (resolve, reject) => compare(
            value, hashedString, (error, result) => error ? reject(error) : resolve(result)
        )
    );
}
