/***
description: google sign in module which verifies id token and returns account data
version: 1.0.0
keywords:
    - google
    - login
    - sign in
    - api
dependencies:
    "google-auth-library": "^1.3.1"
documentation: |
    const { GoogleSignIn } = require('@coolgk/google-sign-in');
    // OR
    // import { GoogleSignIn } from '@coolgk/google-sign-in';

    const googleSignIn = new GoogleSignIn({
        clientId: '936046478010-98hmjf60qmhdpfeok14l4f39ptka6t48.apps.googleusercontent.com'
    });

    const invalidToken = '...';
    const validToken = '...';

    (async () => {
        const account1 = await googleSignIn.verify(invalidToken);
        console.log(account1); // false

        const account2 = await googleSignIn.verify(validToken);
        console.log(account2);
        // {
        //     azp: '...',
        //     aud: '...',
        //     sub: '123123123',
        //     email: 'abc@exmaple.com',
        //     email_verified: true,
        //     at_hash: 'asdfasdfasdfasdfa',
        //     exp: 1520633389,
        //     iss: 'accounts.google.com',
        //     jti: 'qfwfasdfasdfasdfasdfasdfasdfadsf',
        //     iat: 1520629789,
        //     name: 'first last',
        //     picture: 'https://lh6.googleusercontent.com/.../photo.jpg',
        //     given_name: 'first',
        //     family_name: 'last',
        //     locale: 'en-GB'
        // }
    })()
*/

/*!
 *  Copyright (c) 2017 Daniel Gong <daniel.k.gong@gmail.com>. All rights reserved.
 *  Licensed under the MIT License.
 */

import { OAuth2Client } from 'google-auth-library';

export interface IOptions {
    clientId: string;
    oAuth2Client?: any;
}

export interface IAccountData {
    [field: string]: any;
}

export class GoogleSignIn {

    private _clientId: string;
    private _oAuth2Client: any;

    constructor (options: IOptions) {
        this._clientId = options.clientId;
        this._oAuth2Client = options.oAuth2Client || new OAuth2Client(this._clientId);
    }

    public async verify (token: string): Promise<boolean | IAccountData> {
        try {
            const ticket = await this._oAuth2Client.verifyIdToken({
                idToken: token,
                audience: this._clientId
            });

            if (ticket) {
                const payload = ticket.getPayload();
                return payload || false;
            }

            return false;
        } catch (error) {
            return false;
        }
    }

}

export default GoogleSignIn;
