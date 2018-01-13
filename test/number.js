'use strict';

// const sinon = require('sinon');
const chai = require('chai');
// chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('Number Module', function () {

    const { round } = require(`../${config.sourceFolder}/number`);

    describe('Round', function () {
        it('should round numbers', () => {
            expect(round(1.3923, 2)).to.equal(1.39);
            expect(round(100, 2)).to.equal(100);
            expect(round(100.1264, 2)).to.equal(100.13);
            expect(round(100.958747, 4)).to.equal(100.9587);
            expect(round(100.958747)).to.equal(100.96);
        });
    });

});
