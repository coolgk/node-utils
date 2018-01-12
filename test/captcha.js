'use strict';

const sinon = require('sinon');
const chai = require('chai');
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('Captcha Module', function () {

    const { Captcha } = require(`../${config.sourceFolder}/captcha`);

    // sandbox secret https://developers.google.com/recaptcha/docs/faq
    const secret = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

    it('should verify', () => {
        const captcha = new Captcha({ secret });
        return expect(captcha.verify('dfasdfa')).to.eventually.have.property('success', true);
    });

    it('should reject on error', () => {
        const request = {
            post: sinon.stub()
        };
        const captcha2 = new Captcha({ secret, request });
        const error = new Error('---');

        const promise = captcha2.verify('abcdedf');
        request.post.callArgWith(1, error);

        return expect(promise).to.be.rejectedWith(error);
    });

});
