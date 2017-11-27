
/*
import { round } from './number';

console.log(round(1.3923, 2));
console.log(round(100, 2));
console.log(round(100.1264, 2));
console.log(round(100.958747, 4));
*/

/**
 * @param {number} number - number to round
 * @param {number} precision - precision
 * @return {number}
 */
export function round (number: number, precision: number = 2): number {
    const factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
};