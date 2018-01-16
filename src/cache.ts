/***
description: a redis wrapper
keywords:
    - redis
    - cache
dependencies:
    "@types/redis": "^2.8.3"
example: |
    import { Cache } from '@coolgk/cache';
    import { createClient } from 'redis';
    // OR
    // const { Cache } = require('@coolgk/cache');
    // const { createClient } = require('redis');

    const client = createClient({
        host: 'localhost',
        port: 12869,
        password: '----'
    });

    const cache = new Cache({
        redisClient: client
    });

    cache.set('abc', {a: 1}, 1).then(console.log); // 'OK'

    cache.get('abc').then(console.log); // { a: 1 }

    setTimeout(() => {
        cache.get('abc').then(console.log); // null
        client.quit();
    }, 1500);

    cache.getSetIfNull(
        'abc',
        () => Promise.resolve('data'),
        10
    ).then((v) => {
        console.log(v); // { a: 1 }
    });

    Promise.all([
        cache.set('x', 'val x'),
        cache.set('y', 'val y'),
        cache.set('z', 'val z')
    ]).then(
        () => Promise.all([
            cache.get('x').then(console.log), // val x
            cache.get('y').then(console.log), // val y
            cache.get('z').then(console.log) // val z
        ])
    ).then(
        () => Promise.all([
            cache.delete('x'),
            cache.delete('y'),
            cache.delete('z')
        ])
    ).then(
        () => Promise.all([
            cache.get('x').then(console.log), // null
            cache.get('y').then(console.log), // null
            cache.get('z').then(console.log) // null
        ])
    );
*/

import { RedisClient } from 'redis';

// for this._redisClient[command]
export interface ICacheClient extends RedisClient {
    [key: string]: any;
}

export interface ICacheConfig {
    readonly redisClient: ICacheClient;
}

export class Cache {

    private _redisClient: ICacheClient;

    /**
     * @param {object} options
     * @param {object} [options.redisClient] - redis client from redis.createClient()
     * redisClient needs to be passed in so the same connection can be used elsewhere and get closed outside this class
     */
    constructor (options: ICacheConfig) {
        this._redisClient = options.redisClient;
    }

    /**
     * @param {string} name - name of the variable
     * @param {*} value - value is always JSON.stringify'ed
     * @param {number} [expiry = 0] - expire time in seconds. 0 = never expire
     * @return {promise}
     */
    public set (name: string, value: any, expiry = 0): Promise<any> {
        const stringValue = JSON.stringify(value);
        return expiry ? this.command('setex', name, expiry, stringValue) : this.command('set', name, stringValue);
    }

    /**
     * @param {string} name - name of the variable
     * @return {promise} - cached value
     */
    public get (name: string): Promise<{}> {
        return this.command('get', name).then((value) => JSON.parse(value));
    }

    /**
     * @param {string|string[]} name - name(s) of the variable
     * @return {promise}
     */
    public delete (name: string | string[]): Promise<{}> {
        return this.command('del', name);
    }

    /**
     * get the cached value, if not set, resolve "callback()" and save the value then return it
     * @param {string} name - name of the variable
     * @param {function} callback - a callback function which returns a value or a promise
     * @param {number} [expiry = 0] - expire time in seconds. 0 = never expire
     * @return {promise} - cached value
     */
    public getSetIfNull (name: string, callback: () => any, expiry = 0): Promise<{}> {
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

    /**
     * @param {string} command - redis command to run
     * @param {array} params - params for the command
     * @return {promise}
     */
    public command (command: string, ...params: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            params.push((error: Error, response: any) => {
                error ? reject(error) : resolve(response);
            });
            this._redisClient[command](...params);
        });
    }
}

export default Cache;
