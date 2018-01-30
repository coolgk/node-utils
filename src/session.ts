/* tslint:disable */
/***
description: An session handler works without cookie (and with cookie too).
version: 1.0.2
keywords:
    - session
    - session handler
    - session without cookie
    - restful session
    - express session
dependencies:
    "@coolgk/token": "^2"
    "@coolgk/jwt": "^2"
    "cookie": "^0.3.1"
    "@types/cookie": "^0.3.1"
documentation: |
    When working without cookie, this class reads the session token from the **"Authorization"** header.
    e.g. **Authorization : Bearer cn389ncoiwuencr...**
    #### Express Middleware
    ```javascript
    // express middleware
    const session = require('@coolgk/session');
    const app = require('express')();

    app.use(
        session.express({
            redisClient: require('redis').createClient({
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD
            }),
            secret: '123' // secret is required for creating the session token / id
        })
    );

    app.use(async (request, response, next) => {
        // allow access if it's the login page or the request has a valid session
        if ('/login' === request.url || await request.session.verifyAndRenew()) { // if session is verified, renew session
            next();
        } else { // deny access
            response.send('Please Login');
            // output
            // 'Please Login'
        }
    });

    app.get('/login', async (request, response, next) => {
        // start a new session (create a new session id)
        const accessToken = await request.session.init();
        // set session variables
        await request.session.set('user', { id: 1, username: 'abc' });
        // send session token/id back
        response.json({ accessToken });
        // output
        // {"accessToken":"eyJleHAiOjAsIml..."}
    });

    app.get('/user', async (request, response, next) => {
        // get session variable
        response.json(await request.session.get('user'));
        // output
        // {"id":1,"username":"abc"}
    });

    app.get('/session', async (request, response, next) => {
        // get all session values
        response.json(await request.session.getAll());
        // output
        // {"user":{"id":1,"username":"abc"}}
    });

    app.get('/logout', async (request, response, next) => {
        // destroy current session
        await request.session.destroy();
        response.json(await request.session.getAll());
        // output
        // {}
    });

    app.listen(8888);
    ```
    #### Native Node App
    ```javascript
    import { Session } from '@coolgk/session';
    // OR
    // const { Session } = require('@coolgk/session');

    const http = require('http');
    http.createServer(async (request, response) => {

        const session = new Session({
            redisClient: require('redis').createClient({
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD
            }),
            secret: '123',
            request,
            response
        });

        // ... some middelware
        // ... in some routes
        // set sesstion
        await session.start();
        await session.set('user', {id: 1, username: 'user@example.com'});

        // check session and renew if verified
        const verified = await session.verifyAndRenew();
        if (verified) {
            // session exists, logged in, do something
        } else {
            // deny access or show login screen
        }

        // show session data
        response.end(
            JSON.stringify(
                await session.getAll()
            )
        ); // {"user":{"id":1,"username":"user@example.com"}}

    }).listen(8888);
    ```
    #### To use without cookie
    Create a session without the **"response"** property and the sessoin object will read the session id from the **"Authorization"** header i.e. **Authorization : Bearer cn389ncoiwuencr...**
    ```javascript
    const session = new Session({
        redisClient: require('redis').createClient({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD
        }),
        secret: '123',
        request
    });
    ```
*/
/* tslint:enable */

import { Token, IRedisClient } from '@coolgk/token';
import { Jwt, IPayload } from '@coolgk/jwt';
import { CookieSerializeOptions, serialize, parse } from 'cookie';
import { ServerResponse, IncomingMessage } from 'http';

export interface IBaseConfig {
    readonly secret: string;
    readonly redisClient: IRedisClient;
    readonly expiry?: number;
    readonly cookie?: CookieSerializeOptions;
    readonly response?: ServerResponse;
    [index: string]: any;
}

export interface IConfig extends IBaseConfig {
    readonly request: IncomingMessage;
}

export interface ISignature {
    [index: string]: any;
}

export const SESSION_NAME = 'session';
export const COOKIE_NAME = 'accessToken';

/**
 * This class extends @coolgk/token see set(), get(), delete(), getAll() in @coolgk/token
 */
export class Session extends Token {

    private _jwt: Jwt;
    private _sessionToken: string;
    private _cookie: CookieSerializeOptions | undefined;
    private _response: ServerResponse | undefined;

    /* tslint:disable */
    /**
     * @param {object} options
     * @param {object} options.redisClient - redis client from redis.createClient()
     * @param {string} options.secret - a string for encrypting the session token
     * @param {object} options.request - the request object in http.createServer() or express request
     * @param {expiry} [options.expiry=3600] - session expiry time in seconds
     * @param {object} [options.response] - the response object in http.createServer() or express response. cookie will be set if the response property is set in the constructor.
     * @param {object} [options.cookie] - cookie options
     * @param {string} [options.cookie.domain] - Specifies the value for the Domain Set-Cookie attribute. By default, no domain is set, and most clients will consider the cookie to apply to only the current domain.
     * @param {function} [options.cookie.encode=encodeURIComponent] - Specifies a function that will be used to encode a cookie's value. Since value of a cookie has a limited character set (and must be a simple string), this function can be used to encode a value into a string suited for a cookie's value.
     * @param {date} [options.cookie.expires] - Specifies the Date object to be the value for the Expires Set-Cookie attribute. By default, no expiration is set, and most clients will consider this a "non-persistent cookie" and will delete it on a condition like exiting a web browser application.
     * @param {boolean} [options.cookie.httpOnly] - Specifies the boolean value for the [HttpOnly Set-Cookie attribute][rfc-6266-5.2.6]. When truthy, the HttpOnly attribute is set, otherwise it is not. By default, the HttpOnly attribute is not set.
     * @param {number} [options.cookie.maxAge] - Specifies the number (in seconds) to be the value for the Max-Age Set-Cookie attribute. The given number will be converted to an integer by rounding down. By default, no maximum age is set.
     * @param {string} [options.cookie.path='/'] - Specifies the value for the Path Set-Cookie attribute.
     * @param {string | boolean} [options.cookie.sameSite] - Specifies the boolean or string to be the value for the SameSite Set-Cookie attribute
     * @param {boolean} [options.cookie.secure] - Specifies the boolean value for the [Secure Set-Cookie attribute][rfc-6266-5.2.5]. When truthy, the Secure attribute is set, otherwise it is not. By default, the Secure attribute is not set.
     */
    /* tslint:enable */
    public constructor (options: IConfig) {
        const cookies = options.request.headers.cookie ? parse(options.request.headers.cookie as string) : {};
        let token = cookies[COOKIE_NAME];

        if (!token && typeof(options.request.headers.authorization) === 'string') {
            token = (options.request.headers.authorization as string).substr(7); // remove Bearer text from the header
        }

        super({
            token,
            redisClient: options.redisClient,
            expiry: options.expiry || 3600,
            prefix: SESSION_NAME
        });

        this._jwt = new Jwt({ secret: options.secret });
        this._sessionToken = token;
        this._cookie = { path: '/', ...options.cookie, maxAge: options.expiry };
        this._response = options.response;
    }

    /* tslint:disable */
    /**
     * an alias of the start() method.
     * initialising a new session
     * @param {object} signature - addtional data for verifying session token e.g. an IP address. you can pass the IP address of an request to the verify() method and it will return false if the IP is different from the IP used for initialisng the session.
     * @return {promise<string>} - a session token string
     */
    /* tslint:enable */
    public init (signature: ISignature = {}): Promise<string> {
        return this.start(signature);
    }

    /* tslint:disable */
    /**
     * an alias of the start() method.
     * initialising a new session
     * @param {object} signature - addtional data for verifying session token e.g. an IP address. you can pass the IP address of an request to the verify() method and it will return false if the IP is different from the IP used for initialisng the session.
     * @return {promise<string>} - a session token string
     */
    /* tslint:enable */
    public rotate (signature: ISignature = {}): Promise<string> {
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
        await this._renewCacheAndCookie();
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
                serialize(COOKIE_NAME, '', { ...this._cookie, maxAge: 0, expires: new Date(0)})
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
        const tokenData = this._verifyJwt();
        if (!tokenData
            || !(tokenData as IPayload).data
            || JSON.stringify((tokenData as IPayload).data.signature) !== JSON.stringify(signature)
        ) {
            return false;
        }
        return await super.verify();
    }

    /* tslint:disable */
    /**
     * verify and renew token, renew only if token is valid (has a valid signature) and not expired
     * @param {object} signature - addtional data for verifying session token e.g. an IP address. you can pass the IP address of an request to the verify() method and it will return false if the IP is different from the IP used for initialisng the session.
     * verify the session token, if valid, renew this token
     * @param {number} [expiry] - in seconds
     * @return {promise<boolean>}
     */
    /* tslint:enable */
    public async verifyAndRenew (signature: ISignature = {}, expiry?: number): Promise<boolean> {
        if (await this.verify(signature)) {
            await this._renewCacheAndCookie(expiry);
            return true;
        }
        return false;
    }

    /**
     * renew session optionally with a different expiry time
     * @param {number} [expiry] - in seconds
     * @return {promise} - false if session has not been started or has a invalid token string
     */
    public async renew (expiry?: number): Promise<any> {
        // has a valid jwt token and has not expired
        if (this._verifyJwt() && await super.verify()) {
            return this._renewCacheAndCookie(expiry);
        }
        return false;
    }

    /**
     * set header for renewing cookie and update cache expiry time
     * @ignore
     * @private
     * @param {number} [expiry] - in seconds
     * @memberof Session
     */
    private _renewCacheAndCookie (expiry?: number): Promise<any> {
        if (this._response) {
            this._response.setHeader(
                'Set-Cookie',
                serialize(
                    COOKIE_NAME,
                    this._sessionToken,
                    expiry ? { ...this._cookie, maxAge: expiry } : this._cookie
                )
            );
        }
        return super.renew(expiry);
    }

    /**
     * verify session jwt token
     * @ignore
     * @private
     * @returns {(boolean | IPayload)}
     * @memberof Session
     */
    private _verifyJwt (): boolean | IPayload {
        return this._jwt.verify(this._sessionToken);
    }
}

export default Session;

export interface IExpressConfig extends IBaseConfig {
    requestFieldName?: string;
}
// for assigngin property to request
export interface IRequest extends IncomingMessage {
    [key: string]: any;
}

export function express (
    options: IExpressConfig
): (request: IRequest, response: ServerResponse, next: () => void) => void {
    return (request, response, next) => {
        request[options.requestFieldName || 'session'] = new Session({ ...options, request, response });
        next();
    };
}
