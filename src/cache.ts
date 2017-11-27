/*
import { Cache, CacheConfig } from './cache';
import { createClient } from 'redis';

const client = createClient({
    host: 'localhost',
    port: 6379,
    password: '---'
});

const config: CacheConfig = {
    redisClient: client
};

const cache = new Cache(config);

cache.set('abc', {a: 1}, 1).then(console.log);

cache.get('abc').then(console.log);

setTimeout(() => {
    cache.get('abc').then(console.log);
    client.quit();
}, 1500);

cache.getSetIfNull(
    'abc',
    () => Promise.resolve('data'),
    10
).then((v) => {
    console.log('-----', v);
});
*/

import { RedisClient } from 'redis';

// for this._redisClient[command]
export interface CacheClient extends RedisClient {
	[key: string]: any;
}

export interface CacheConfig {
    readonly redisClient: CacheClient;
}

export class Cache {

    private _redisClient: CacheClient;
    /**
     * @param {object} options -
     * @param {object} options.redisClient - redis client
     */
    constructor (options: CacheConfig) {
        this._redisClient = options.redisClient;
    }

    /**
     * @param {string} command - redis command to run
     * @param {*[]} params - params for the command
     * @return {promise}
     */
    command (command: string, ...params: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            params.push((error: Error, response: any) => {
                error ? reject(error) : resolve(response);
            });
            this._redisClient[command](...params);
        });
    }

    /**
     * @param {string} name - name of the variable
     * @param {*} value - value is always JSON.stringify'ed
     * @param {number} [expiry = 0] - expire time in seconds. 0 = never expire
     * @return {promise}
     */
    set (name: string, value: any, expiry = 0): Promise<any> {
        return expiry ? this.command('setex', name, expiry, JSON.stringify(value)) : this.command('set', name, JSON.stringify(value));
    }

    /**
     * @param {string} name - name of the variable
     * @return {promise}
     */
    get (name: string): Promise<{}> {
        return this.command('get', name).then((value) => {
            return Promise.resolve(JSON.parse(value));
        });
    }

    /**
     * this method tries to get the cached value
     * if not found in cache, it resolves the "value" parameter and saves the value to cache then returns it
     *
     * @param {string} name - name of the variable
     * @param {function} callback - a callback function which returns a value or a promise
     * @param {number} [expiry = 0] - expire time in seconds. 0 = never expire
     * @return {promise}
     */
    getSetIfNull (name: string, callback: Function, expiry = 0): Promise<{}> {
        return this.get(name).then((cachedValue) => {
            if (null === cachedValue) {
                return Promise.resolve(callback()).then(
                    (value) => this.set(name, value, expiry).then(
                        () => value
                    )
                );
            }
            return cachedValue;
        });
    }

}
