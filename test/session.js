'use strict';

// const sinon = require('sinon');
const chai = require('chai');
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('Token Module', function () {

    // const { Session } = require(`../${config.sourceFolder}/session`);

    // let redisClient;
    // let token;

    // const session = new Session();

    // session.set();
    // session.get();
    // session.renew();

    before(() => {
        // redisClient = require('redis').createClient({
            // host: config.redis.url,
            // port: config.redis.port,
            // password: config.redis.password
        // });

        // token = new Token({
            // redisClient: redisClient,
            // expiry: 1,
            // token: `token:test:${Math.random()}`
        // });
    });

    after(async () => {
        // await token.destroy();
        // redisClient.quit();
    });

    // it('should not be able to set var & be invalid before renew', () => {
        // return Promise.all([
            // expect(token.set('_timestamp', 231)).to.eventually.have.property('error', TokenError.RESERVED_NAME),
            // expect(token.set('ab', 121)).to.eventually.have.property('error', TokenError.EXPIRED_TOKEN),
            // expect(token.verify()).to.eventually.be.false
        // ]);
    // });

});
