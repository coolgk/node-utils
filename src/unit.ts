/*

import { bytesToString, millisecondsToString } from './unit';

console.log(
    bytesToString(500),
    bytesToString(5000),
    bytesToString(5000000),
    bytesToString(5000000000),
    bytesToString(5000000000000),
    bytesToString(5000000000000000),
    bytesToString(5000000000000000000),
);

console.log('1 sec', millisecondsToString(1 * 1000));
console.log('1 min', millisecondsToString(60 * 1000));
console.log('100 sec', millisecondsToString(100 * 1000));
console.log('3 hrs', millisecondsToString(60 * 60 * 3 * 1000));
console.log('1.5 days', millisecondsToString(60 * 60 * 24 * 1.5 * 1000));
console.log('65 days', millisecondsToString(60 * 60 * 24 * 65 * 1000));
console.log('365 days', millisecondsToString(60 * 60 * 24 * 365 * 1000));
console.log('500 days', millisecondsToString(60 * 60 * 24 * 500 * 1000));
console.log('900 days', millisecondsToString(60 * 60 * 24 * 900 * 1000));
console.log('1900 days', millisecondsToString(60 * 60 * 24 * 1900 * 1000));
console.log('365001 days', millisecondsToString(60 * 60 * 24 * 365001 * 1000));

*/
import { round } from './number';

export function bytesToString (value: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];

    while (units.length > 1 && value > 1023) {
        units.shift();
        value = value / 1024;
    }

    return round(value, 2) + units[0];
}

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
