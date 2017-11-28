/*
import { Token } from './token';

const token = new Token({
    cacheConfig: {
        host: 'localhost',
        port: 6379,
        password: 'cQ4j3bJdfZtSQmzS7wTwJuxB3CSuhRUnLGEFANADkFmXUKXT8PxQKtpm92TeUH4AqJeyWaw%Rg9Q@kn@_qR%M`zs,$3v:Cj>ye5S{Q%q@84w'
    },
    expiry: 30
});

token.verify().then((result) => {
    console.log(result); //
})

token.set();
token.get();
token.getAll();
token.delete();

token.verify();
token.destroy();

token.renew();

*/

/**
 * a secure token can be manually revoked from db (jwt itself by default cannot be revoked until expired)
 */

import { Cache } from './cache';

export interface TokenConfig {
    token: string;
    cache: Cache;
    expiry?: number;
    prefix?: string;
};

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
     * @param {object} [options.jwtConfig={secret: process.env.secret}] - jwtConfig in ./jwt
     * @param {object} options.cacheConfig - cacheConfig in ./cache
     * @param {string} [options.name='token'] - prefix used in redis e.g. token:[TOKEN_STRING...]
     * @param {number} [options.expiry=0] - in seconds. 0 = never expire
     * @param {object} [options.data] - data to save in jwt
     * @param {string} [options.token] - create a token based on this preloaded token string
     */
    constructor ({
        cache,
        expiry = 0,
        token,
        prefix = 'token'
    }: TokenConfig) {
        this._cache = new Cache(cacheConfig);
        this._expiry = expiry;
        this._token = token;
        this._name = `${prefix}:${this._token}`;
    }

    /**
     * @param {number} expiry - in seconds
     * @return {promise}
     */
    async renew (expiry: number = this._expiry): Promise<any> {
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
    async set (name: string, value: any): Promise<any> {
        return this._token ? this._cache.command(
            'hset', this._name, name, JSON.stringify(value)
        ) : {error: Errors.DESTROYED_TOKEN};
    }

    /**
     * @return {promise}
     */
    async verify (): Promise<{}> {
        if (this._token) {
            const tokenData = this._jwt.verify(this._token);
            if (tokenData) {
                const timestamp = await this.get('_timestamp');
                if (timestamp) {
                    return tokenData;
                }
            }
        }
        return {error: Errors.INVALID_TOKEN}
    }

    /**
     * get the value of a data field
     * @param {string} name - data field name
     * @return {promise}
     */
    async get (name: string): Promise<any> {
        if (this._token) {
            const value = await this._cache.command('hget', this._name, name);
            return JSON.parse(value);
        }
        return undefined;
    }

    /**
     * delete the token
     * @return {promise}
     */
    destroy (): Promise<any> {
        this._token = '';
        return this._cache.command('del', this._name);
    }

    /**
     * delete a data field in the token
     * @return {promise}
     */
    async delete (name: string): Promise<any> {
        if (!this._token) {
            return {error: Errors.DESTROYED_TOKEN};
        }
        return this._cache.command('hdel', this._name, name);
    }

    /**
     * get the values of all data fields in the token
     * @return {promise}
     */
    async getAll (): Promise<boolean | {}> {
        if (this._token) {
            const values = await this._cache.command('hgetall', this._name);
            if (values) {
                for (const property in values) {
                    values[property] = JSON.parse(values[property]);
                }
                return values;
            }
        }
        return undefined;
    }
}
