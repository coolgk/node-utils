/***
description: an expirable, revocable, renewable token with data storage
version: 2.0.7
keywords:
    - token
    - session token
dependencies:
    "@coolgk/cache": "^2"
engines:
    node: ">=8"
example: |
    import { Token } from '@coolgk/token';
    import { createClient } from 'redis';
    // OR
    // const { Token } = require('@coolgk/token');
    // const createClient = require('redis').createClient;

    (async () => {

        const redisClient = createClient({
            host: 'localhost',
            port: 6379,
            password: '----'
        });

        const token = new Token({
            redisClient: redisClient,
            expiry: 5,
            token: 'abcde'
        });

        console.log(
            await token.verify()
        ) // false

        await token.renew();

        console.log(
            await token.verify()
        ) // true

        console.log(
            await token.get('var1');
        ); // null

        console.log(
            await token.getAll()
        ); // {}

        await token.set('var1', {a: 'var1', b: false});

        console.log(
            await token.get('var1');
        ); // {a: 'var1', b: false}

        await token.set('var2', 'string var 2');

        console.log(
            await token.getAll()
        ); // { var1: { a: 'var1', b: false }, var2: 'string var 2' }

        await token.delete('var2');

        console.log(
            await token.get('var2');
        ); // null

        console.log(
            await token.getAll()
        ); // { var1: { a: 'var1', b: false } }

        await token.destroy();

        console.log(
            await token.verify()
        ) // false

        console.log(
            await token.get('var1');
        ); // null

        console.log(
            await token.getAll()
        ); // {}

        redisClient.quit();
    })()
*/

/*!
 *  Copyright (c) 2017 Daniel Gong <daniel.k.gong@gmail.com>. All rights reserved.
 *  Licensed under the MIT License.
 */

// allow a token string (e.g. jwt, uuid) to be manually revoked or renewed
// (./jwt cannot be renewed or revoked until expired)

import { Cache, ICacheClient } from '@coolgk/cache';

export interface IConfig {
    readonly token: string;
    readonly expiry?: number;
    readonly prefix?: string;
}

export interface ITokenConfigWithCache extends IConfig {
    readonly cache: Cache;
}

export interface ITokenConfig extends IConfig {
    readonly redisClient: ICacheClient;
}

export interface ITokenValues {
    [field: string]: any;
}

export { ICacheClient as IRedisClient };

export const DEFAULT_PREFIX = 'token';

/**
 * Error Codes
 * @const
 * @type {object}
 * @property {string} INVALID_TOKEN - invalid token string
 * @property {string} RESERVED_NAME - reserved names are used when setting token variables e.g. _timestamp
 * @property {string} EXPIRED_TOKEN - token expired or renew() has not been called
 */
export enum TokenError {
    INVALID_TOKEN = 'INVALID_TOKEN',
    RESERVED_NAME = 'RESERVED_NAME',
    EXPIRED_TOKEN = 'EXPIRED_TOKEN'
}

export class Token {

    private _token!: string;
    private _cache: Cache;
    private _expiry: number;
    private _name!: string;
    private _prefix: string;

    /**
     * @param {object} options
     * @param {string} options.token - token string for creating a token object
     * @param {object} options.redisClient - redis client from redis.createClient()
     * @param {string} [options.prefix='token'] - prefix used in redis e.g. token:[TOKEN_STRING...]
     * @param {number} [options.expiry=0] - in seconds. 0 = never expire
     */
    public constructor (options: ITokenConfig | ITokenConfigWithCache) {
        this._cache = (options as ITokenConfig).redisClient ?
            new Cache(options as ITokenConfig) : (options as ITokenConfigWithCache).cache;
        this._expiry = options.expiry || 0;
        this._prefix = options.prefix || DEFAULT_PREFIX;
        this.setToken(options.token);
    }

    /**
     * @param {number} [expiry] - in seconds
     * @return {promise}
     */
    public async renew (expiry?: number): Promise<any> {
        if (!this._token) {
            return {error: TokenError.INVALID_TOKEN};
        }

        if (expiry || expiry === 0) {
            this._expiry = expiry;
        }

        // need to set a var first to create the variable in cache
        await this._cache.command('hset', this._name, '_timestamp', JSON.stringify(Date.now()));
        return this._expiry ? this._cache.command('expire', this._name, this._expiry) : true;
    }

    /**
     * set a data field value
     * @param {string} name - field name
     * @param {*} value - anything can be JSON.stringify'ed
     * @return {promise}
     */
    public async set (name: string, value: any): Promise<any> {
        if (name === '_timestamp') {
            return {error: TokenError.RESERVED_NAME};
        }
        // should not set if token expired or not newed yet
        if (this._expiry && !(await this.get('_timestamp'))) {
            return {error: TokenError.EXPIRED_TOKEN};
        }
        return this._token ? this._cache.command(
            'hset', this._name, name, JSON.stringify(value)
        ) : {error: TokenError.INVALID_TOKEN};
    }

    /**
     * verify if token has expired
     * @return {promise<boolean>}
     */
    public async verify (): Promise<boolean> {
        const timestamp = await this.get('_timestamp');
        return !!timestamp;
    }

    /**
     * get the value of a data field
     * @param {string} name - data field name
     * @return {promise}
     */
    public async get (name: string): Promise<any> {
        if (this._token) {
            const value = await this._cache.command('hget', this._name, name);
            return JSON.parse(value);
        }
        return null;
    }

    /**
     * delete the token
     * @return {promise}
     */
    public destroy (): Promise<any> {
        this._token = '';
        return this._cache.command('del', this._name);
    }

    /**
     * delete a data field in the token
     * @param {string} name - data field name
     * @return {promise}
     */
    public async delete (name: string): Promise<any> {
        if (!this._token) {
            return {error: TokenError.INVALID_TOKEN};
        }
        return this._cache.command('hdel', this._name, name);
    }

    /**
     * get the values of all data fields in the token
     * @return {promise<{}>}
     */
    public async getAll (): Promise<ITokenValues> {
        if (this._token) {
            const values = await this._cache.command('hgetall', this._name);
            if (values) {
                delete values._timestamp;
                for (const property in values) {
                    values[property] = JSON.parse(values[property]);
                }
                return values;
            }
        }
        return {};
    }

    /**
     * set a new token string
     * @param {string} token - new token string
     */
    public setToken (token: string) {
        this._token = token;
        this._name = `${this._prefix}:${this._token}`;
    }
}

export default Token;
