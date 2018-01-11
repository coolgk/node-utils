'use strict';

// const sinon = require('sinon');
const expect = require('chai').expect;
const config = require('../test.config.js');

describe('Array Module', () => {

    const { toArray } = require(`../${config.sourceFolder}/array`);
    // const { toArray } = require('@coolgk/array');

    // before(() => {});
    // beforeEach(() => {});

    describe('toArray', () => {

        it('should convert undefined to an empty array', () => {
            expect(toArray(undefined)).to.be.an('array').that.is.empty;
        });

        it('should convert boolean, string, object values to array', () => {
            expect(toArray(false)).to.deep.equal([ false ]);
            expect(toArray('')).to.deep.equal([ '' ]);
            expect(toArray({ a: 1 })).to.deep.equal([ { a: 1 } ]);
        });

        it('should keep array as is', () => {
            expect(toArray([1,2,3])).to.deep.equal([1,2,3]);
        });

    });

});
