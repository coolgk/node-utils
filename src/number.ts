
/**
 * @param {number} value - number to round
 * @param {number} precision - precision
 * @return {number}
 */
export function round (value: number, precision: number = 2): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
}
