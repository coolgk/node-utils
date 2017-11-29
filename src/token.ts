/*
import { Token } from './token';
import { createClient } from 'redis';
// OR
// const Token = require('./token');
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

/**
 * allow a token string (e.g. jwt, uuid) to be manually revoked or renewed
 * (./jwt cannot be renewed or revoked until expired)
 */

import { Cache, ICacheClient } from './cache';

export interface IConfig {
    readonly expiry?: number;
    readonly prefix?: string;
}

export interface ITokenConfigWithCache extends IConfig {
    readonly token: string;
    readonly cache: Cache;
}

export interface ITokenConfig extends IConfig {
    readonly token: string;
    readonly redisClient: ICacheClient;
}

export enum Errors {
    INVALID_TOKEN = 'INVALID_TOKEN',
    DESTROYED_TOKEN = 'DESTROYED_TOKEN'
}

export class Token {
    private _cache: Cache;
    private _expiry: number;
    private _name: string;
    private _token: string;

    /**
     * @param {object} options
     * @param {string} options.token - token string for creating a token object
     * @param {object} options.redisClient - cacheConfig in ./cache
     * @param {string} [options.prefix='token'] - prefix used in redis e.g. token:[TOKEN_STRING...]
     * @param {number} [options.expiry=0] - in seconds. 0 = never expire
     */
    public constructor (options: ITokenConfig | ITokenConfigWithCache) {
        this._cache = (options as ITokenConfig).redisClient ?
            new Cache(options as ITokenConfig) : (options as ITokenConfigWithCache).cache;
        this._expiry = options.expiry || 0;
        this._token = options.token;
        this._name = `${options.prefix || 'token'}:${this._token}`;
    }

    /**
     * @param {number} expiry - in seconds
     * @return {promise}
     */
    public async renew (expiry: number = this._expiry): Promise<any> {
        if (!this._token) {
            return {error: Errors.DESTROYED_TOKEN};
        }
        await this.set('_timestamp', new Date());
        return expiry ? this._cache.command('expire', this._name, expiry) : true;
    }

    /**
     * set a data field value
     * @param {string} name - field name
     * @param {*} value - anything can be JSON.stringify'ed
     * @return {promise}
     */
    public async set (name: string, value: any): Promise<any> {
        return this._token ? this._cache.command(
            'hset', this._name, name, JSON.stringify(value)
        ) : {error: Errors.DESTROYED_TOKEN};
    }

    /**
     * @return {promise}
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
            return {error: Errors.DESTROYED_TOKEN};
        }
        return this._cache.command('hdel', this._name, name);
    }

    /**
     * get the values of all data fields in the token
     * @return {promise}
     */
    public async getAll (): Promise<{}> {
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
}
