/***
description: recapcha wrapper
version: 2.0.5
keywords:
    - recapcha
dependencies:
    "request": "^2.83.0"
example: |
    const { verify } = require('@coolgk/captcha');

    verify(captchaResponse).then((response) => {
        console.log(response); // { success: true, challenge_ts: '2017-12-03T08:19:48Z', hostname: 'www.google.com' }
                               // { success: false, 'error-codes': [ 'invalid-input-response' ] }
    });

    // OR

    import { Captcha } from '@coolgk/captcha';
    // OR
    // const { Captcha } = require('@coolgk/captcha');

    const captcha = new Captcha({
        secret: '-------'
    });

    const captchaResponse = '---------';

    captcha.verify(captchaResponse).then((response) => {
        console.log(response); // { success: true, challenge_ts: '2017-12-03T08:19:48Z', hostname: 'www.google.com' }
                               // { success: false, 'error-codes': [ 'invalid-input-response' ] }
    });
*/

/*!
 *  Copyright (c) 2017 Daniel Gong <daniel.k.gong@gmail.com>. All rights reserved.
 *  Licensed under the MIT License.
 */

import * as request from 'request';

export interface ICaptchaConfig {
    readonly request?: typeof request; // DI for test
    readonly secret: string;
}

export class Captcha {

    public static readonly _RECAPTCHA_URL = 'https://www.google.com/recaptcha/api/siteverify';

    protected _secret: string;
    protected _request: typeof request;

    /**
     * @param {object} options
     * @param {object} options.secret - google captcha secret https://www.google.com/recaptcha/admin#site/337294176
     */
    public constructor (options: ICaptchaConfig) {
        this._request = options.request || request;
        this._secret = options.secret;
    }

    /**
     * @param {string} response - repsonse from recaptcha
     * @param {string} [remoteip] - ip address
     * @param {promise}
     */
    public verify (response: string, remoteip?: string): Promise<{}> {
        return new Promise((resolve, reject) => {
            this._request.post(
                {
                    url: Captcha._RECAPTCHA_URL,
                    form: {
                        secret: this._secret,
                        response,
                        remoteip
                    }
                },
                (error, httpResponse, data) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(JSON.parse(data));
                    }
                }
            );
        });
    }
}

export function verify (secret: string, response: string, remoteip?: string) {
    return new Promise((resolve, reject) => {
        request.post(
            {
                url: Captcha._RECAPTCHA_URL,
                form: {
                    secret,
                    response,
                    remoteip
                }
            },
            (error, httpResponse, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(data));
                }
            }
        );
    });
}

export default Captcha;
