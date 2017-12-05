let promise: Promise<any> = Promise.resolve(undefined);
const backlogs: Promise<any>[] = [];

/**
 * @param {function} callback - callback function that returns a promise or any other types
 * @param {number} [limit=1] - number of callback to run at the same time, by default one callback at a time
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
