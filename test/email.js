'use strict';

const sinon = require('sinon');
const chai = require('chai');
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('Email Module', function () {

    const { Email } = require(`../${config.sourceFolder}/email`);
    let email;
    let emailClient;

    before(() => {
        emailClient = {
            send: sinon.stub()
        };
        email = new Email({host: 'localhost', emailClient});
    });

    it('should send email', (done) => {

        const subject = 'hello this is email subject';
        const message = `<html><body><h1>test</h1>some message here
                <img src="cid:my-image" width="500" height="250"></body></html>`;

        const sendPromise = email.send({
            subject,
            message,
            from: {
                    name: 'Daniel Gong',
                    email: 'daniel.k.gong@example.com'
            },
            to: [
                {
                    name: 'Dan Go',
                    email: 'dan@example.com'
                },
                'gong@example.com'
            ],
            attachments: [
                {
                    path: '/tmp/test.png',
                    name: 'screenshot.png'
                },
                {
                    path:"/tmp/test.png",
                    headers: {"Content-ID": "<my-image>"}
                }
            ]
        });

        emailClient.send.callArg(1);

        sendPromise.then((sentMessage) => {

            expect(
                emailClient.send.calledWith(sinon.match({
                    subject,
                    text: 'test some message here',
                    from: '"Daniel Gong" <daniel.k.gong@example.com>',
                    to: '"Dan Go" <dan@example.com>, "gong@example.com" <gong@example.com>',
                    attachment: [
                        {
                            data: message,
                            alternative: true
                        },
                        {
                            path: "/tmp/test.png",
                            type: "image/png",
                            name: "screenshot.png"
                        },
                        {
                            path: "/tmp/test.png",
                            type: "image/png",
                            headers: {"Content-ID":"<my-image>"},
                            name: "test.png"
                        }
                    ]
                }))
            ).to.be.true;

            done();

        }).catch(done);

    });

});
