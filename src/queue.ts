/*
// call functions in order

import { queue } from './queue';

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
queue(a);
queue(b);
queue(c);

// call a 5 times, each will wait until previous call resolves
[1,2,3,4,5].forEach(() => {
    queue(a)
});

// run limit to run two jobs at a time
[1,2,3,4,5,6,7,8,9].forEach(() => {
    queue(a, 2)
});

*/

let promise = Promise.resolve();
let backlogs = [];
/**
 * @param {function} callback - callback function that returns a promise
 * @param {number} [limit=1] - number of callback to run at the same time, by default we run one callback at a time
 * @return {promise}
 */
export function queue (callback: Function, limit: number = 1): Promise<any> {
    // if (limit === 1) {
        // return promise = promise.then((data) => callback(data));
    // }
    const jobs = backlogs.filter(callback => callback !== undefined);
    if (jobs.length < limit) {
        const value = callback();
        backlogs.push(
            Promise.resolve(value).then(() => backlogs.length - 1)
        );
        return value;
    } else {
        return Promise.all(jobs).then((index) => {
            backlogs[index] = undefined;
            const value = callback();
            backlogs.push(
                Promise.resolve(value).then(
                    (value) => ({value, index: backlogs.length - 1})
                )
            );
            return value;
            // return queue(callback, limit);
        });
    }
}
