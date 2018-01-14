'use strict';

// const sinon = require('sinon');
const chai = require('chai');
// chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('Url Module', function () {

    const { getParams } = require(`../${config.sourceFolder}/url`);

    describe('getParams', function () {
        it('convert url pattern to params', () => {
            expect(getParams('/123', '/:id')).to.deep.equal({ id: '123' });
            expect(getParams('/123/abc/456', '/:id/abc/:value')).to.deep.equal({ id: '123', value: '456' });
            expect(getParams('/123/456', ':id/:value')).to.deep.equal({ id: '123', value: '456' });
            expect(getParams('/123/fasdf', '')).to.deep.equal({});
            expect(getParams('', 'dsfaS')).to.deep.equal({});
        });
    });

});
