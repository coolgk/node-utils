/***
description: array utilities
version: 2.0.4
keywords:
    - toArray
example: |
    import { toArray } from '@coolgk/array';
    // OR
    // const { toArray } = require('@coolgk/array');

    const a = undefined;
    const b = false;
    const c = '';
    const d = [1,2,3];
    const e = {a:1};

    console.log(toArray(a)); // []
    console.log(toArray(b)); // [ false ]
    console.log(toArray(c)); // [ '' ]
    console.log(toArray(d)); // [ 1, 2, 3 ]
    console.log(toArray(e)); // [ { a: 1 } ]
*/

/*!
 *  Copyright (c) 2017 Daniel Gong <daniel.k.gong@gmail.com>. All rights reserved.
 *  Licensed under the MIT License.
 */

/**
 * @param {*} data - any data to be type cast to array
 * @return {array}
 */
export function toArray (data: any) {
    return data instanceof Array ? data : data === undefined ? [] : [data];
}
