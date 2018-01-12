'use strict';

// const sinon = require('sinon');
const chai = require('chai');
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('Captcha Module', function () {

    const { Captcha } = require(`../${config.sourceFolder}/captcha`);

    // sandbox secret https://developers.google.com/recaptcha/docs/faq
    const secret = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
    const captcha = new Captcha({ secret });

    it('should verify', () => {
        return expect(captcha.verify('dfasdfa')).to.eventually.have.property('success', true);
    });

});
