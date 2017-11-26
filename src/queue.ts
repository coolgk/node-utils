/*
// call functions in order

import { queue } from './queue';

function a (x) {
    console.log('start a');
    return new Promise((resolve) => setTimeout(() => { console.log('end a', x); resolve('a') }, 1300));
}

function b (x) {
    console.log('start b');
    return new Promise((resolve) => setTimeout(() => { console.log('end b', x); resolve('b') }, 1200));
}

function c (x) {
    console.log('start c');
    return new Promise((resolve) => setTimeout(() => { console.log('end c', x); resolve('c') }, 100));
}

// call a, b, c in order i.e. b will not start until a resolves
queue(a);
queue(b);
queue(c);

// call a 5 times, each will wait until previous call resolves
[1,2,3,4,5].forEach(() => {
    queue(a)
});

// run 3 jobs at a time
[1,2,3,4,5,6,7,8,9,10].forEach(() => {
    queue(a, 3)
});

*/

let promise = Promise.resolve(undefined);
let backlogs = [];

/**
 * @param {function} callback - callback function that returns a promise or any other types
 * @param {number} [limit=1] - number of callback to run at the same time, by default we run one callback at a time
 * @return {promise}
 */
export function queue (callback: (data?: any) => any, limit: number = 1): Promise<any> {
    if (backlogs.length === limit) {
        promise = Promise.all(backlogs.splice(0));
    }
    return backlogs[
        backlogs.push(
            promise.then((data) => callback(data))
        )
        - 1
    ];
}
