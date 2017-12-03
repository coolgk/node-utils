
import { round } from './number';

/**
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
