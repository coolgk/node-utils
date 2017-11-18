/*
Example

import { encode, decode, encodeUrl, decodeUrl } from './base64';

const a = 'https://www.google.co.uk/?a=b'
const hash = encode(a);
const urlHash = encodeUrl(a);

console.log(a);
console.log(hash);
console.log(decode(hash));

console.log(urlHash);
console.log(decodeUrl(urlHash));
*/

export function encode (data: string = ''): string {
    return (new Buffer(data)).toString('base64');
}

export function decode (data: string = ''): string {
    return (new Buffer(data, 'base64')).toString();
}

/**
 * @param {string|array|buffer} data
 */
export function encodeUrl (data: string = ''): string {
    return encode(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * @param {string} data - base64 encoded url to decode
 */
export function decodeUrl (data: string = ''): string {
    return decode((data + '==='.slice((data.length + 3) % 4)).replace(/\-/g, '+').replace(/_/g, '/'));
}
