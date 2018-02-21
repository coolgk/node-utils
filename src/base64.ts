/***
description: base64 encoded decode functions
version: 2.0.4
keywords:
    - base64
    - encode
    - decode
    - encodeUrl
    - decodeUrl
example: |
    import { encode, decode, encodeUrl, decodeUrl } from '@coolgk/base64';
    // OR
    // const { encode, decode, encodeUrl, decodeUrl } = require('@coolgk/base64');

    const a = 'https://www.google.co.uk/?a=b'
    const hash = encode(a);
    const urlHash = encodeUrl(a);

    console.log(a); // https://www.google.co.uk/?a=b
    console.log(hash); // aHR0cHM6Ly93d3cuZ29vZ2xlLmNvLnVrLz9hPWI=
    console.log(decode(hash)); // https://www.google.co.uk/?a=b

    console.log(urlHash); // aHR0cHM6Ly93d3cuZ29vZ2xlLmNvLnVrLz9hPWI
    console.log(decodeUrl(urlHash)); // https://www.google.co.uk/?a=b
*/

/*!
 *  Copyright (c) 2017 Daniel Gong <daniel.k.gong@gmail.com>. All rights reserved.
 *  Licensed under the MIT License.
 */

/**
 * @param {string} data - string to encode
 * @return {string}
 */
export function encode (data: string = ''): string {
    return (new Buffer(data)).toString('base64');
}

/**
 * @param {string} data - encoded hash
 * @return {string}
 */
export function decode (data: string = ''): string {
    return (new Buffer(data, 'base64')).toString();
}

/**
 * @param {string} data - string to encode
 * @return {string}
 */
export function encodeUrl (data: string = ''): string {
    return encode(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * @param {string} data - base64 encoded url to decode
 * @return {string}
 */
export function decodeUrl (data: string = ''): string {
    return decode((data + '==='.slice((data.length + 3) % 4)).replace(/\-/g, '+').replace(/_/g, '/'));
}
