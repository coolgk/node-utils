'use strict';

const sinon = require('sinon');
const chai = require('chai');
// chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe.skip('Token Module', function () {

    const { Session, COOKIE_NAME } = require(`../${config.sourceFolder}/session`);

    let session;
    let sessionConfig;

    const request = {
        headers: {
            authorization: ''
        },
        cookie: `${COOKIE_NAME}=value;`
    };

    const response = {};

    sinon.stub(response, 'setHeader').callsFake((header, value) => {
        request.cookie = `${COOKIE_NAME}=${value};`;
    })

    before(() => {
        sessionConfig = {
            redisClient: require('redis').createClient({
                host: config.redis.host,
                port: config.redis.port,
                password: config.redis.password
            }),
            expiry: 1,
            secret: '123',
            request,
            response,
            cookie: {
                httpOnly: true
            }
        };
    });

    beforeEach(() => {
        request.cookie = '';
        request.headers.authorization = '';
        session = new Session(sessionConfig);
    });

    afterEach(() => {
        return session.destroy();
    });

    after(async () => {
        sessionConfig.redisClient.quit();
    });

    it('', () => {

        // session.set();

        // return Promise.all([
        //     expect(token.set('_timestamp', 231)).to.eventually.have.property('error', TokenError.RESERVED_NAME),
        //     expect(token.set('ab', 121)).to.eventually.have.property('error', TokenError.EXPIRED_TOKEN),
        //     expect(token.verify()).to.eventually.be.false
        // ]);
    });

});
