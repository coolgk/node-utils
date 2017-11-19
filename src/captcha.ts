/*
import { Captcha } from './captcha';

const captcha = new Captcha({
	secret: '---'
});

captcha.verify('input_response', 'ip').then((response) => {
	console.log(response);
});
*/

import * as request from './request';

export interface CaptchaConfig {
	readonly request?: typeof request;
	readonly secret: string;
};

export class Captcha {

	static readonly RECAPTCHA_URL = 'https://www.google.com/recaptcha/api/siteverify';

	protected _secret: string;
	protected _request: typeof request;

	/**
	 * @param {object} options
	 * @param {object} options.request - ./request
	 * @param {object} options.secret - google captcha secret https://www.google.com/recaptcha/admin#site/337294176
	 */
    constructor (options: CaptchaConfig) {
        this._request = options.request || request;
        this._secret = options.secret;
    }

    verify (response: string, remoteip: string): Promise<{}> {
        return this._request.post(
            Captcha.RECAPTCHA_URL,
            {
                data: {
                    secret: this._secret,
                    response,
                    remoteip
                }
            }
        ).then(
			(response) => response.json
		);
    }
}
