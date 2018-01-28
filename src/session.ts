/***
description: an API (without cookie) and HTTP (with cookie) session handler
version: 1.0.0
keywords:
    - session
    - session handler
    - session without cookie
    - restful session
dependencies:
    "@coolgk/token": "^2"
    "@coolgk/jwt": "^2"
    "cookie": "^0.3.1"
    "@types/cookie": "^0.3.1"
documentation: |
    When working without cookie, this class reads the session token from the **Authorization** header.
    e.g. **Authorization : Bearer cn389ncoiwuencr...**
    #### Example Form
    ```javascript
    import { Session } from '@coolgk/session';
    ```
*/

import { Token, IRedisClient } from '@coolgk/token';
import { Jwt, IPayload } from '@coolgk/jwt';
import { CookieSerializeOptions, serialize, parse } from 'cookie';
import { ServerResponse, IncomingMessage } from 'http';

export interface IConfig {
    readonly request: IncomingMessage;
    readonly secret: string;
    readonly expiry: number;
    readonly redisClient: IRedisClient;
    readonly cookie?: CookieSerializeOptions;
    readonly response?: ServerResponse;
}

export interface ISignature {
    [index: string]: any;
}

export const SESSION_NAME = 'session';
export const COOKIE_NAME = 'accessToken';

/**
 * This class extends @coolgk/token see set(), get(), delete(), getAll() in @coolgk/token
 * @export
 * @class Session
 * @extends {Token}
 */
export class Session extends Token {

    private _jwt: Jwt;
    private _sessionToken: string;
    private _cookie: CookieSerializeOptions | undefined;
    private _response: ServerResponse | undefined;

    /* tslint:disable */
    /**
     * @param {object} options
     * @param {object} redisClient - redis client from redis.createClient()
     * @param {string} secret - a string for encrypting the session token
     * @param {object} request - the request object in http.createServer() or express request
     * @param {expiry} [expiry=3600] - session expiry time in seconds
     * @param {object} [response] - the response object in http.createServer() or express response. cookie will be set if the response property is set in the constructor.
     * @param {object} [cookie] - cookie options
     * @param {string} [cookie.domain] - Specifies the value for the Domain Set-Cookie attribute. By default, no domain is set, and most clients will consider the cookie to apply to only the current domain.
     * @param {function} [cookie.encode=ecodeURIComponent] - Specifies a function that will be used to encode a cookie's value. Since value of a cookie has a limited character set (and must be a simple string), this function can be used to encode a value into a string suited for a cookie's value.
     * @param {date} [cookie.expires] - Specifies the Date object to be the value for the Expires Set-Cookie attribute. By default, no expiration is set, and most clients will consider this a "non-persistent cookie" and will delete it on a condition like exiting a web browser application.
     * @param {boolean} [cookie.httpOnly] - Specifies the boolean value for the [HttpOnly Set-Cookie attribute][rfc-6266-5.2.6]. When truthy, the HttpOnly attribute is set, otherwise it is not. By default, the HttpOnly attribute is not set.
     * @param {number} [cookie.maxAge] - Specifies the number (in seconds) to be the value for the Max-Age Set-Cookie attribute. The given number will be converted to an integer by rounding down. By default, no maximum age is set.
     * @param {string} [cookie.path] - Specifies the value for the Path Set-Cookie attribute. By default, the path is considered the "default path". By default, no maximum age is set, and most clients will consider this a "non-persistent cookie" and will delete it on a condition like exiting a web browser application.
     * @param {string | boolean} [cookie.sameSite] - Specifies the boolean or string to be the value for the SameSite Set-Cookie attribute
     * @param {boolean} [cookie.secure] - Specifies the boolean value for the [Secure Set-Cookie attribute][rfc-6266-5.2.5]. When truthy, the Secure attribute is set, otherwise it is not. By default, the Secure attribute is not set.
     */
    /* tslint:enable */
    public constructor (options: IConfig) {
        const cookies = parse(String(options.request.headers.cookie || ''));
        const token = cookies[COOKIE_NAME] || String(options.request.headers.authorization).replace(/^Bearer /, '');

        super({
            token,
            redisClient: options.redisClient,
            expiry: options.expiry || 3600,
            prefix: SESSION_NAME
        });

        this._jwt = new Jwt({ secret: options.secret });
        this._sessionToken = token;
        this._cookie = { ...options.cookie, maxAge: options.expiry };
        this._response = options.response;
    }

    /**
     * @alias Session.start
     */
    public init (signature: ISignature = {}): Promise<any> {
        return this.start(signature);
    }

    /**
     * @alias Session.start
     */
    public rotate (signature: ISignature = {}): Promise<any> {
        return this.start(signature);
    }

    /* tslint:disable */
    /**
     * initialising a new session
     * @param {object} signature - addtional data for verifying session token e.g. an IP address. you can pass the IP address of an request to the verify() method and it will return false if the IP is different from the IP used for initialisng the session.
     * @return {promise<string>} - a session token string
     */
    /* tslint:enable */
    public async start (signature: ISignature = {}): Promise<string> {
        this._sessionToken = this._jwt.generate({ signature });
        this.setToken(this._sessionToken);
        await this.renew();
        return this._sessionToken;
    }

    /**
     * destory the current session
     * @return {promise}
     */
    public async destroy (): Promise<any> {
        const destroyPromise = await super.destroy();
        if (this._response) {
            this._response.setHeader(
                'Set-Cookie',
                serialize(COOKIE_NAME, '', { ...this._cookie, maxAge: 0, expires: new Date()})
            );
        }
        return destroyPromise;
    }

    /* tslint:disable */
    /**
     * verify the session token
     * @param {object} signature - addtional data for verifying session token e.g. an IP address. you can pass the IP address of an request to the verify() method and it will return false if the IP is different from the IP used for initialisng the session.
     * @return {promise<boolean>}
     */
    /* tslint:enable */
    public async verify (signature: ISignature = {}): Promise<boolean> {
        const tokenData = this._jwt.verify(this._sessionToken);
        if (!tokenData
            || !tokenData.data
            || JSON.stringify((tokenData.data as IPayload).signature) !== JSON.stringify(signature)
        ) {
            return false;
        }
        return super.verify();
    }

    /**
     * verify the session token, if valid, renew this token
     * @return {promise<boolean>}
     */
    public async verifyAndRenew (signature: ISignature = {}): Promise<boolean> {
        if (await this.verify(signature)) {
            await this.renew();
            return true;
        }
        return false;
    }

    /**
     * renew session
     * @return {promise}
     */
    public async renew (expiry?: number): Promise<any> {
        if (this._response) {
            this._response.setHeader(
                'Set-Cookie',
                serialize(COOKIE_NAME, this._sessionToken, this._cookie)
            );
        }
        return super.renew(expiry);
    }
}

export default Session;
