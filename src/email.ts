/*
import { Email } from './email';

let email = new Email({
    host: 'localhost'
});
email.send({
    subject: 'hello this is email subject',
    from: {
            name: 'Daniel Gong',
            email: 'danie.gong@example.com'
    },
    to: [
        {
            name: 'Cian Duggan',
            email: 'danie.gong+label@example.com'
        },
        'danie.gong+3@example.com'
    ],
    message: '<html><body><h1>test</h1>some message here <img src="cid:my-image" width="500" height="250"></body></html>',
    attachments: [
        {
            path: '/var/www/clientportalapi/uploads/portal2.png',
            name: 'screenshot.png'
        },
        {
            path:"/var/www/clientportalapi/uploads/portal2.png",
            headers:{"Content-ID": "<my-image>"}
        }
    ]
}).then((sentMessage) => {
    console.log(sentMessage);
}).catch((error) => {
    console.log(error);
});

*/

// npm i -S emailjs mime @types/mime

import { stripTags } from './string';
import emailjs = require('emailjs');
import { getType } from 'mime';

export interface EmailConfig {
    readonly stripTags?: typeof stripTags;
    readonly emailClient?: typeof emailjs;
    readonly getMimeType?: typeof getType;
    readonly user?: string;
    readonly password?: string;
    readonly host: string;
    readonly port?: number;
    readonly ssl?: boolean;
    readonly tls?: boolean;
    readonly domain?: string;
    readonly authentication?: string[];
};

export interface EmailAddress {
    name?: string;
    readonly email: string;
}

export interface EmailAttachment {
    readonly name?: string;
    readonly path: string;
    type?: string;
    readonly method?: string;
    readonly headers?: {[propName: string]: string};
}

export interface SendConfig {
    readonly subject: string;
    readonly message?: string;
    readonly from: string | EmailAddress;
    readonly to: (string | EmailAddress)[];
    readonly cc?: (string | EmailAddress)[];
    readonly bcc?: (string | EmailAddress)[];
    readonly attachments?: EmailAttachment[];
}

export class Email {
    private _options: EmailConfig;
    private _emailClient: typeof emailjs;
    private _stripTags: typeof stripTags;
    private _getMimeType: typeof getType;

    /**
     * @param {object} options
     * @param {function} [options.stripTags] - ./stripTags.js
     * @param {string} [options.user] - username for logging into smtp
     * @param {string} [options.password] - password for logging into smtp
     * @param {string} options.host - smtp host
     * @param {string} [options.port] - smtp port (if null a standard port number will be used)
     * @param {boolean} [options.ssl] - boolean (if true or object, ssl connection will be made)
     * @param {boolean} [options.tls] - boolean (if true or object, starttls will be initiated)
     * @param {string} [options.domain] - domain to greet smtp with (defaults to os.hostname)
     * @param {string[]} [options.authentication] - authentication methods (ex: email.authentication.PLAIN, email.authentication.XOAUTH2)
     */
    constructor (options: EmailConfig) {
        this._options = options;
        this._emailClient = options.emailClient || emailjs;
        this._stripTags = options.stripTags || stripTags;
        this._getMimeType = options.getMimeType || getType;
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
    send (options: SendConfig): Promise<{}> {
        ['cc', 'bcc', 'from', 'to'].forEach((field: string) => {
            if (options[field]) {
                options[field] = this._formatEmailAddress(field === 'from' ? [options[field]] : options[field]);
            }
        });

        if (options.attachments) {
            options.attachments.forEach((attachment: EmailAttachment) => {
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

            this._emailClient.server.connect(this._options).send(sendOptions, (error, message) => {
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
    private _formatEmailAddress (emails: (string | EmailAddress)[]): string {
        let formattedEmails = [];
        emails.forEach((email: string | EmailAddress) => {
            if (typeof email === 'string') {
                email = {email: email};
            }
            formattedEmails.push(`"${email.name || email.email}" <${email.email}>`);
        });
        return formattedEmails.join(', ');
    }
}
