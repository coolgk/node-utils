/*
Example:
blocking call functions in order
e.g.
const blockingCall = require('blockingCall.js');

function a (x) {
    return new Promise((resolve) => setTimeout(() => { console.log('a', x); resolve('a') }, 300));
}

function b (x) {
    return new Promise((resolve) => setTimeout(() => { console.log('b', x); resolve('b') }, 200));
}

function c (x) {
    return new Promise((resolve) => setTimeout(() => { console.log('c', x); resolve('c') }, 100));
}

// call a, b, c in order i.e. b will not start until a resolves
blockingCall(a);
blockingCall(b);
blockingCall(c);

// call a 5 times, each will wait until previous call resolves
[1,2,3,4,5].forEach(() => {
    blockingCall(a)
});
*/

let promise = Promise.resolve();
/**
 * @param {function} callback - callback function that returns a promise
 * @return {promise}
 */
export function blockingCall (callback: Function): Promise<any> {
    return promise = promise.then((data) => callback(data));
}
