/**
 * @param {*} data - any data to be type cast to array
 * @return {array}
 */
export function toArray (data: any) {
    return data instanceof Array ? data : data === undefined ? [] : [data];
}
