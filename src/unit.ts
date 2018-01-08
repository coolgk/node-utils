/***
description: unit conversion
keywords:
    - unit
    - conversion
example: |
    import { bytesToString, millisecondsToString } from '@coolgk/unit';
    // OR
    // const { bytesToString, millisecondsToString } = require('@coolgk/unit');

    console.log(
        bytesToString(500), // 500B
        bytesToString(5000), // 4.88KB
        bytesToString(5000000), // 4.77MB
        bytesToString(5000000000), // 4.66GB
        bytesToString(5000000000000), // 4.55TB
        bytesToString(5000000000000000), // 4547.47TB
        bytesToString(5000000000000000000) // 4547473.51TB
    );

    console.log('1 sec', millisecondsToString(1 * 1000)); // 1 second
    console.log('1 min', millisecondsToString(60 * 1000)); // 1 minute
    console.log('100 sec', millisecondsToString(100 * 1000)); // 1 minute
    console.log('3 hrs', millisecondsToString(60 * 60 * 3 * 1000)); // 3 hour
    console.log('1.5 days', millisecondsToString(60 * 60 * 24 * 1.5 * 1000)); // 1 day
    console.log('65 days', millisecondsToString(60 * 60 * 24 * 65 * 1000)); // 2 month
    console.log('365 days', millisecondsToString(60 * 60 * 24 * 365 * 1000)); // 1 year
    console.log('500 days', millisecondsToString(60 * 60 * 24 * 500 * 1000)); // 1 year
    console.log('900 days', millisecondsToString(60 * 60 * 24 * 900 * 1000));// 2 year
    console.log('1900 days', millisecondsToString(60 * 60 * 24 * 1900 * 1000)); // 5 year
    console.log('365001 days', millisecondsToString(60 * 60 * 24 * 365001 * 1000)); // 1013 year
*/

import { round } from './number';

/**
 * or use https://www.npmjs.com/package/filesize
 * @param {number} value - value in byte
 * @return {string} value in KB, MB, GB or TB
 */
export function bytesToString (value: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];

    while (units.length > 1 && value > 1023) {
        units.shift();
        value = value / 1024;
    }

    return round(value, 2) + units[0];
}

/**
 * @param {number} value - number of milliseconds
 * @return {string} value in second, minute, hour, day, month or year
 */
export function millisecondsToString (value: number): string {
    const units: [[string, number]] = [
        ['second', 60],
        ['minute', 60],
        ['hour', 24],
        ['day', 30],
        ['month', 12],
        ['year', 1000]
    ];

    value = value / 1000; // ms to second

    let [[unit, maxValue]] = units;

    while (units.length > 1 && value >= maxValue) {
        units.shift();
        value = value / maxValue;
        [[unit, maxValue]] = units;
    }

    return `${Math.floor(value)} ${unit}`;
}
