// https://en.wikipedia.org/wiki/JSON_Web_Token
// https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/

/*
import { Jwt } from './jwt';

const jwt = new Jwt({secret: 'abc'});

const string = 'http://example.com/a/b/c?a=1';

const token = jwt.generate(string);

console.log(
	jwt.verify(token),
	jwt.verify(token+'1')
);

const token2 = jwt.generate(string, 200);

console.log(
	jwt.verify(token2),
	jwt.verify(token+'1')
);

setTimeout(() => {
	console.log(jwt.verify(token2));
}, 250);
*/

import { createHmac } from 'crypto';
import { encodeUrl, decodeUrl } from './base64';

export interface JwtConfig {
	encodeUrl?: typeof encodeUrl;
	decodeUrl?: typeof decodeUrl;
	secret: string;
}

export class Jwt {

	private _encodeUrl: typeof encodeUrl;
	private _decodeUrl: typeof decodeUrl;
	private _secret: string;

    /**
     * @param {object} options
     * @param {string} options.secret - for encryption
     * @param {object} options.encodeUrl - base64 encodeUrl function in "./base64"
     * @param {object} options.decodeUrl - base64 decodeUrl function in "./base64"
     */
    constructor (options: JwtConfig) {
        this._encodeUrl = options.encodeUrl || encodeUrl;
        this._decodeUrl = options.decodeUrl || decodeUrl;
        this._secret = options.secret;
    }

    /**
     * @param {*} data - any data can be JSON.stringify'ed
     * @param {number} [expiry=0] - in milliseconds 0 = never expire
     * @return {string}
     */
    generate (data: any, expiry?: number): string {
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
            data: data
        }));

        return payload + '.' + encodeURIComponent(createHmac('sha256', this._secret).update(payload).digest('base64'));
    }

	/**
	 * @param {string} token - token to verify
	 * @return {boolean}
	 */
    verify (token: string = ''): boolean | {} {
        const [unsignedToken, tokenSignature] = token.split('.');
        try {
            const payload = JSON.parse(this._decodeUrl(unsignedToken));
            const signature = createHmac('sha256', this._secret).update(unsignedToken).digest('base64');
            // fail token if expiry date is set and expired or signatures do not match
            return (payload.exp === 0 || payload.exp >= Date.now()) && signature === decodeURIComponent(tokenSignature) ? payload : false;
        } catch (error) {
            if (error.message.indexOf('JSON') === -1) {
                throw error;
            }
            return false;
        }
    }
}
