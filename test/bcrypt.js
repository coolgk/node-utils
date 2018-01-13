'use strict';

// const sinon = require('sinon');
const chai = require('chai');
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('Bcrypt Module', () => {

    const { encrypt, verify } = require(`../${config.sourceFolder}/bcrypt`);

    it('should encrypt and verify', (done) => {
        encrypt('abc123').then((hash) => {
            verify('abc123', hash).then((valid) => {
                expect(valid).to.be.true;
                done();
            });
        });
    });

    it('should reject wrong hash', () => {
        return expect(verify('ab', 'invalidhash')).to.eventually.be.rejectedWith('Not a valid BCrypt hash.');
    });

    it('should invalidate wrong input', (done) => {
        encrypt('abc123').then((hash) => {
            verify('invalidpass', hash).then((valid) => {
                expect(valid).to.be.false;
                done();
            });
        });
    });

});
