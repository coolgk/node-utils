'use strict';

// const sinon = require('sinon');
const expect = require('chai').expect;
const config = require('../test.config.js');

describe('Base64 Module', () => {

    const { encode, decode, encodeUrl, decodeUrl } = require(`../${config.sourceFolder}/base64`);

    // before(() => {});
    // beforeEach(() => {});

    it('should encode', () => {
        expect(encode('https://www.google.co.uk/?a=b')).to.equal('aHR0cHM6Ly93d3cuZ29vZ2xlLmNvLnVrLz9hPWI=');
    });

    it('should decode', () => {
        expect(decode('aHR0cHM6Ly93d3cuZ29vZ2xlLmNvLnVrLz9hPWI=')).to.equal('https://www.google.co.uk/?a=b');
    });

    it('should encode url', () => {
        expect(encodeUrl('https://www.google.co.uk/?a=b')).to.equal('aHR0cHM6Ly93d3cuZ29vZ2xlLmNvLnVrLz9hPWI');
    });

    it('should decode url hash', () => {
        expect(decodeUrl('aHR0cHM6Ly93d3cuZ29vZ2xlLmNvLnVrLz9hPWI')).to.equal('https://www.google.co.uk/?a=b');
    });

    it('should return empty string for falsy input', () => {
        expect(encode()).to.equal('');
        expect(decode()).to.equal('');
        expect(encodeUrl()).to.equal('');
        expect(decodeUrl()).to.equal('');
    });

});
