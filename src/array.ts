/*
import { toArray } from './array';

const a = undefined;
const b = false;
const c = '';
const d = [1,2,3];
const e = {a:1};

console.log(toArray(a));
console.log(toArray(b));
console.log(toArray(c));
console.log(toArray(d));
console.log(toArray(e));
*/

export function toArray (data) {
    return data instanceof Array ? data : data === undefined ? [] : [data];
}
