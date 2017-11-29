/*
import { Email } from './email';

const email = new Email({host: 'localhost'});

// OR
// import emailjs = require('emailjs');
// const email = new Email({
    // emailClient: emailjs.server.connect({host: 'localhost'})
// });

email.send({
    subject: 'hello this is email subject',
    from: {
            name: 'Daniel Gong',
            email: 'daniel.gong@example.com'
    },
    to: [
        {
            name: 'Dan Go',
            email: 'daniel.gong@example.com'
        },
        'daniel.gong@example.com'
    ],
    message: '<html><body><h1>test</h1>some message <img src="cid:my-image" width="500" height="250"></body></html>',
    attachments: [
        {
            path: '/file/path/image.png',
            name: 'screenshot.png'
        },
        {
            path:"/file/path/image.png",
            headers:{"Content-ID": "<my-image>"}
        }
    ]
}).then((sentMessage) => {
    console.log(sentMessage);
}).catch((error) => {
    console.log(error);
});
*/

// mime package (https://www.npmjs.com/package/mime) does not work in node 8 using mime-types instead
// npm i -S emailjs mime-types

import emailjs = require('emailjs');
import mimeTypes = require('mime-types');
import { basename } from 'path';
import { stripTags } from './string';

export interface IEmailConfig {
    readonly host: string;
    readonly stripTags?: typeof stripTags;
    readonly getMimeType?: typeof mimeTypes.lookup;
    readonly user?: string;
    readonly password?: string;
    readonly port?: number;
    readonly ssl?: boolean;
    readonly tls?: boolean;
    readonly domain?: string;
    readonly authentication?: string[];
}

export interface IEmailClient {
    send: (param1: any, param2: any) => any;
}

export interface IEmailConfigWithClient {
    readonly emailClient: IEmailClient;
    readonly stripTags?: typeof stripTags;
    readonly getMimeType?: typeof mimeTypes.lookup;
}

export interface IEmailAddress {
    name?: string;
    readonly email: string;
}

export interface IEmailAttachment {
    readonly path: string;
    name?: string;
    type?: string;
    readonly method?: string;
    readonly headers?: {[propName: string]: string};
}

export interface ISendConfig {
    readonly subject: string;
    readonly message?: string;
    readonly from: string | IEmailAddress;
    readonly to: (string | IEmailAddress)[];
    readonly cc?: (string | IEmailAddress)[];
    readonly bcc?: (string | IEmailAddress)[];
    readonly attachments?: IEmailAttachment[];
}

export class Email {
    private _emailClient: IEmailClient;
    private _stripTags: typeof stripTags;
    private _getMimeType: typeof mimeTypes.lookup;

    /**
     * @param {object} options
     * @param {function} [options.stripTags] - ./stripTags.js
     * @param {string} [options.user] - username for logging into smtp
     * @param {string} [options.password] - password for logging into smtp
     * @param {string} [options.host='localhost'] - smtp host
     * @param {string} [options.port] - smtp port (if null a standard port number will be used)
     * @param {boolean} [options.ssl] - boolean (if true or object, ssl connection will be made)
     * @param {boolean} [options.tls] - boolean (if true or object, starttls will be initiated)
     * @param {string} [options.domain] - domain to greet smtp with (defaults to os.hostname)
     * @param {string[]} [options.authentication] - authentication methods
     * @see https://www.npmjs.com/package/emailjs#emailserverconnectoptions
     */
    public constructor (options: (IEmailConfig | IEmailConfigWithClient) = {host: 'localhost'}) {
        this._emailClient = (options as IEmailConfigWithClient).emailClient ?
            (options as IEmailConfigWithClient).emailClient : emailjs.server.connect(options as IEmailConfig);
        this._stripTags = options.stripTags || stripTags;
        this._getMimeType = options.getMimeType || mimeTypes.lookup;
    }

    /**
     * @param {object} options
     * @param {string} options.subject - email subject
     * @param {string} [options.message] - html email message
     * @param {(string|object)[]} options.to - to email address
     * @param {string} options.to[].name - name of the recipient
     * @param {string} options.to[].email - email address of the recipient
     * @param {string | object} [options.from] - see options.to
     * @param {(string|object)[]} [options.cc] - see options.to
     * @param {(string|object)[]} [options.bcc] - see options.to
     * @param {object[]} [attachments] - email attachments
     * @param {string} attachments.path - file path
     * @param {string} [attachments.name] - file name
     * @param {string} [attachments.type] - file mime type
     * @param {string} [attachments.method] - method to send attachment as (used by calendar invites)
     * @param {object} [attachments.headers] - attachment headers, header: value pairs, e.g. {"Content-ID":"<my-image>"}
     * @return {promise}
     */
    public send (options: ISendConfig): Promise<{}> {
        ['cc', 'bcc', 'from', 'to'].forEach((field: string) => {
            if (options[field]) {
                options[field] = this._formatEmailAddress(field === 'from' ? [options[field]] : options[field]);
            }
        });

        if (options.attachments) {
            options.attachments.forEach((attachment: IEmailAttachment) => {
                if (!attachment.name) {
                    attachment.name = basename(attachment.path);
                }
                if (!attachment.type) {
                    attachment.type = this._getMimeType(attachment.path);
                }
            });
        }

        const sendOptions = {
            ...options,
            text: this._stripTags(options.message),
            attachment: [
                {
                    data: options.message,
                    alternative: true
                },
                ...(options.attachments || [])
            ]
        };

        return new Promise((resolve, reject) => {
            // remove unsupported custom properties for emailjs
            delete sendOptions.message;
            delete sendOptions.attachments;

            this._emailClient.send(sendOptions, (error, message) => {
                error ? reject(error) : resolve(message);
            });
        });
    }

    /**
     * @param {(string|object)[]} emails - to email address
     * @param {string} emails[].name - name of the recipient
     * @param {string} emails[].email - email address of the recipient
     * @return {string} - "name name" <email@email.com>, "name2" <email@email.com> ...
     */
    private _formatEmailAddress (emails: (string | IEmailAddress)[]): string {
        const formattedEmails = [];
        emails.forEach((email: string | IEmailAddress) => {
            if (typeof email === 'string') {
                email = {email};
            }
            formattedEmails.push(`"${email.name || email.email}" <${email.email}>`);
        });
        return formattedEmails.join(', ');
    }
}
