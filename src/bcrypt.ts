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

export function encrypt (string: string): Promise<string> {
    return new Promise(
        (resolve, reject) => hash(
            string, null, null, (error, hash) => error ? reject(error) : resolve(hash)
        )
    );
}

export function verify (string: string, hash: string): Promise<boolean> {
    return new Promise(
        (resolve, reject) => compare(
            string, hash, (error, result) => error ? reject(error) : resolve(result)
        )
    )
}
