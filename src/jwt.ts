/* tslint:disable */
/***
description: a simple jwt token class
keywords:
    - jwt
dependencies:
    "@coolgk/base64": "^1.0.8"
example: |
    import { Jwt } from '@coolgk/jwt';
    // OR
    // const { Jwt } = require('@coolgk/jwt');

    const jwt = new Jwt({secret: 'abc'});

    const string = 'http://example.com/a/b/c?a=1';

    const token = jwt.generate(string);

    console.log(
        jwt.verify(token), // { exp: 0, iat: 1512307492763, rng: 0.503008668963175, data: 'http://example.com/a/b/c?a=1' }
        jwt.verify(token+'1') // false
    );

    const token2 = jwt.generate(string, 200);

    console.log(
        jwt.verify(token2), // { exp: 1512307493026, iat: 1512307492826, rng: 0.5832258275608753, data: 'http://example.com/a/b/c?a=1' }
        jwt.verify(token+'1') // false
    );

    setTimeout(() => {
        console.log(jwt.verify(token2)); // false
    }, 250);
*/
/* tslint:enable */

// https://en.wikipedia.org/wiki/JSON_Web_Token
// https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/

import { createHmac } from 'crypto';
import { decodeUrl, encodeUrl } from '@coolgk/base64';

export interface IJwtConfig {
    encodeUrl?: typeof encodeUrl; // DI for test
    decodeUrl?: typeof decodeUrl; // DI for test
    secret: string;
}

export class Jwt {

    private _encodeUrl: typeof encodeUrl; // base64 encodeUrl function in "@coolgk/base64"
    private _decodeUrl: typeof decodeUrl; // base64 decodeUrl function in "@coolgk/base64"
    private _secret: string;

    /**
     * @param {object} options
     * @param {string} options.secret - for encryption
     */
    public constructor (options: IJwtConfig) {
        this._encodeUrl = options.encodeUrl || encodeUrl;
        this._decodeUrl = options.decodeUrl || decodeUrl;
        this._secret = options.secret;
    }

    /**
     * @param {*} data - any data can be JSON.stringify'ed
     * @param {number} [expiry=0] - in milliseconds 0 = never expire
     * @return {string}
     */
    public generate (data: any, expiry?: number): string {
        // header is ignored for now as it is always sha256
        /*
        const header = JWT._services.base64.encodeUrl(JSON.stringify({
            typ: 'JWT',
            alg: 'hs256'
        }));
        */
        const issuedAt = Date.now();
        const payload = this._encodeUrl(JSON.stringify({
            // jti: 12312, // jwt id
            exp: expiry ? expiry + issuedAt : 0,
            iat: issuedAt,
            rng: Math.random(),
            data
        }));

        return payload + '.' + encodeURIComponent(createHmac('sha256', this._secret).update(payload).digest('base64'));
    }

    /**
     * @param {string} token - token to verify
     * @return {boolean|object} - false or the payload of the token
     */
    public verify (token: string = ''): boolean | {} {
        const [unsignedToken, tokenSignature] = token.split('.');
        try {
            const payload = JSON.parse(this._decodeUrl(unsignedToken));
            const signature = createHmac('sha256', this._secret).update(unsignedToken).digest('base64');
            // fail token if expiry date is set and expired or signatures do not match
            return (payload.exp === 0 || payload.exp >= Date.now())
                && signature === decodeURIComponent(tokenSignature) ? payload : false;
        } catch (error) {
            if (error.message.indexOf('JSON') === -1) {
                throw error;
            }
            return false;
        }
    }
}

export default Jwt;
