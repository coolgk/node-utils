/***
description: array utilities
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

/**
 * @param {*} data - any data to be type cast to array
 * @return {array}
 */
export function toArray (data: any) {
    return data instanceof Array ? data : data === undefined ? [] : [data];
}
