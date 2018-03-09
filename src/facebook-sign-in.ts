/***
description: facebook sign in module which verifies client access token and returns account data
version: 1.0.2
keywords:
    - facebook
    - login
    - sign in
    - api
dependencies:
    "request": "^2.83.0"
    "request-promise-native": "^1.0.5"
    "@types/request": "^2.47.0"
    "@types/request-promise-native": "^1.0.14"
example: |
    const { FacebookSignIn } = require('@coolgk/facebook-sign-in');
    // OR
    // import { FacebookSignIn } from '@coolgk/facebook-sign-in';

    const facebookSignIn = new FacebookSignIn({
        clientId: '...',
        secret: '...'
    });

    const invalidToken = '...';
    const validToken = '...';

    (async () => {
        const account1 = await facebookSignIn.verify(invalidToken);
        console.log(account1); // false

        const account2 = await facebookSignIn.verify(validToken);
        console.log(account2); // { email: 'abc@example.com', id: '123123123123123123' }
    })()
*/

/*!
 *  Copyright (c) 2017 Daniel Gong <daniel.k.gong@gmail.com>. All rights reserved.
 *  Licensed under the MIT License.
 */

import { get } from 'request-promise-native';

export interface IOptions {
    clientId: string;
    secret: string;
    get?: any;
}

export interface IAccountData {
    [field: string]: any;
}

/**
 * @export
 * @class FacebookSignIn
 */
export class FacebookSignIn {

    public static readonly _RECAPTCHA_URL = 'https://graph.facebook.com';

    private _clientId: string;
    private _secret: string;
    private _getRequest: any;

    /**
     * @param {object} options
     * @param {string} options.clientId - facebook app id
     * @param {string} options.secret - facebook app secret
     * @memberof FacebookSignIn
     */
    constructor (options: IOptions) {
        this._clientId = options.clientId;
        this._secret = options.secret;
        this._getRequest = options.get || get;
    }

    /**
     * verify access token from clients and return false or account data
     * @param {string} token - facebook user's token string
     * @param {string} [fields='email'] - fields to fetch from user's facebook account. comma separated value e.g. id,name,email
     * @returns {(Promise<false | object>)} - false if access token is invalid otherwise returns account data
     * @memberof FacebookSignIn
     */
    public async verify (token: string, fields: string = 'email'): Promise<boolean | IAccountData> {
        const tokenResponse = await this._getRequest(
            `${FacebookSignIn._RECAPTCHA_URL}/debug_token?input_token=${token}&access_token=${this._clientId}|${this._secret}`
        );
        const tokenData = JSON.parse(tokenResponse);
        if (tokenData.data.is_valid && String(tokenData.data.app_id) === this._clientId) {
            const accountDataResponse = await this._getRequest(
                `${FacebookSignIn._RECAPTCHA_URL}/${tokenData.data.user_id}?access_token=${token}&fields=${fields}`
            );
            return JSON.parse(accountDataResponse);
        }
        return false;
    }

}

export default FacebookSignIn;
