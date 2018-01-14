'use strict';

// const sinon = require('sinon');
const chai = require('chai');
// chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('Unit Module', function () {

    const { bytesToString, millisecondsToString } = require(`../${config.sourceFolder}/unit`);

    describe('bytesToString', function () {
        it('convert bytes to string', () => {
            expect(bytesToString(500)).to.equal('500B');
            expect(bytesToString(5000)).to.equal('4.88KB');
            expect(bytesToString(5000000)).to.equal('4.77MB');
            expect(bytesToString(5000000000)).to.equal('4.66GB');
            expect(bytesToString(5000000000000)).to.equal('4.55TB');
            expect(bytesToString(5000000000000000)).to.equal('4547.47TB');
            expect(bytesToString(5000000000000000000)).to.equal('4547473.51TB');
        });
    });

    describe('millisecondsToString', function () {
        it('convert milliseconds to string', () => {
            expect(millisecondsToString(1 * 1000)).to.equal('1 second');
            expect(millisecondsToString(60 * 1000)).to.equal('1 minute');
            expect(millisecondsToString(100 * 1000)).to.equal('1 minute');
            expect(millisecondsToString(60 * 60 * 3 * 1000)).to.equal('3 hour');
            expect(millisecondsToString(60 * 60 * 24 * 1.5 * 1000)).to.equal('1 day');
            expect(millisecondsToString(60 * 60 * 24 * 65 * 1000)).to.equal('2 month');
            expect(millisecondsToString(60 * 60 * 24 * 365 * 1000)).to.equal('1 year');
            expect(millisecondsToString(60 * 60 * 24 * 500 * 1000)).to.equal('1 year');
            expect(millisecondsToString(60 * 60 * 24 * 900 * 1000)).to.equal('2 year');
            expect(millisecondsToString(60 * 60 * 24 * 1900 * 1000)).to.equal('5 year');
            expect(millisecondsToString(60 * 60 * 24 * 365001 * 1000)).to.equal('1013 year');
        });
    });

});
