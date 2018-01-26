'use strict';

// const sinon = require('sinon');
const chai = require('chai');
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('JWT Module', function () {

    const { Jwt, JwtError } = require(`../${config.sourceFolder}/jwt`);

    const jwt = new Jwt({secret: 'abc'});

    it('should encode and verify', () => {
        const string = 'http://example.com/a/b/c?a=1';
        const token = jwt.generate(string);

        expect(token.includes('.')).to.be.true;
        expect(jwt.verify(token)).to.have.property('data', string);
        expect(jwt.verify(token+'1')).to.be.false;
    });

    it('should expire token', (done) => {
        const data = {a: 1, b: 'x'};
        const token = jwt.generate(data, 30);

        expect(token.includes('.')).to.be.true;
        expect(jwt.verify(token)).to.have.deep.property('data', data);
        expect(jwt.verify(token+'1')).to.be.false;

        setTimeout(() => {
            expect(jwt.verify(token)).to.be.false;
            done();
        }, 60);
    });

    it('should fail on invalid strings', () => {
        expect(jwt.verify()).to.be.false;
        expect(jwt.verify('asdfa.fwqfqef')).to.be.false;
    });

    it('should deal with secret being undefined', () => {
        expect(() => new Jwt()).to.throw(JwtError.SECRET_CANNOT_BE_EMPTY);
        // const jwt = new Jwt();
        // const token = jwt.generate({});
        // expect(jwt.verify(token)).to.have.deep.property('data', {});

        expect(() => new Jwt({})).to.throw(JwtError.SECRET_CANNOT_BE_EMPTY);
        // const jwt2 = new Jwt({});
        // const token2 = jwt.generate();
        // expect(jwt2.verify(token2)).to.not.have.property('data');

        expect(() => new Jwt({secret: undefined})).to.throw(JwtError.SECRET_CANNOT_BE_EMPTY);
        // const jwt3 = new Jwt({secret: undefined});
        // const token3 = jwt.generate();
        // expect(jwt3.verify(token3)).to.not.have.property('data');
    });

});
