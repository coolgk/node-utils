/***
description: number utitlies
version: 2.0.3
keywords:
    - number utitlies
    - round
example: |
    import { round } from '@coolgk/number';
    // OR
    // const { round } = require('@coolgk/number');

    console.log(round(1.3923, 2)); // 1.39
    console.log(round(100, 2)); // 100
    console.log(round(100.1264, 2)); // 100.13
    console.log(round(100.958747, 4)); // 100.9587
*/

/**
 * @param {number} value - number to round
 * @param {number} precision - precision
 * @return {number}
 */
export function round (value: number, precision: number = 2): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
}
