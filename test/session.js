'use strict';

const sinon = require('sinon');
const chai = require('chai');
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('Session Module', function () {

    const { Session, COOKIE_NAME, SESSION_NAME, express } = require(`../${config.sourceFolder}/session`);
    const { Cache } = require(`../${config.sourceFolder}/cache`);

    let session;
    let sessionConfig;
    let promises;
    let redisClient;

    before(() => {
        redisClient = require('redis').createClient({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password
        });
    });

    beforeEach(() => {
        sessionConfig = {
            redisClient,
            expiry: 10,
            secret: '123',
            request: {
                headers: {
                    authorization: '',
                    cookie: ''
                }
            },
            response: {
                setHeader: sinon.stub().callsFake((header, content) => {
                    sessionConfig.request.headers.cookie = content;
                })
            },
            cookie: {
                httpOnly: true
            }
        };
        promises = [];
        session = new Session(sessionConfig);
    });

    afterEach(() => {
        return session.destroy();
    });

    after(async () => {
        redisClient.quit();
    });

    it('should initialise a session', async () => {
        expect(await session.verify()).to.be.false;
        await session.init();
        expect(await session.verify()).to.be.true;
    });

    it('start a session: start one if no valid or renew existing session', async () => {
        expect(await session.verify()).to.be.false;

        const token = await session.start();

        expect(await session.verify()).to.be.true;

        const value = Math.random();
        await session.set('a', value);

        const newToken = await session.start();

        expect(token).to.equal(newToken);
        expect(await session.get('a')).to.equal(value);
    });

    it('should rotate a session', async () => {
        const destory = sinon.stub(session, 'destroy');

        const token = await session.init();

        const value = Math.random();
        await session.set('a', value);

        const newToken = await session.rotate();

        expect(destory.calledOnce).to.be.true;
        expect(token).to.not.equal(newToken);
        expect(await session.get('a')).to.equal(value);
    });

    it('should verify correctly with signature', async () => {
        await session.init({a: 'x'});

        promises.push(
            expect(session.verify()).to.eventually.be.false
        );

        promises.push(
            expect(session.verify({a: 'y'})).to.eventually.be.false
        );

        promises.push(
            expect(session.verify({a: 'x'})).to.eventually.be.true
        );

        return Promise.all(promises);
    });

    it('should not renew / set before init i.e. a valid token', () => {
        promises.push(
            expect(session.renew()).to.eventually.be.false
        );

        promises.push(
            expect(session.set('abc', 'xyz')).to.eventually.have.property('error')
        );

        promises.push(
            expect(session.get('abc')).to.eventually.be.null
        );

        promises.push(
            expect(session.verify()).to.eventually.be.false
        );

        return Promise.all(promises);
    });

    it('should not renew if expired', (done) => {
        const session = new Session(Object.assign(sessionConfig, { expiry: 1 }));
        session.rotate().then(() => {
            setTimeout(() => {
                session.renew().then((result) => {
                    expect(result).to.be.false;
                    done();
                });
            }, 1100);
        });
    });

    it('should set the correct name in redis', async () => {
        const token = await session.start();
        const cache = new Cache({ redisClient });
        return expect(
            cache.command('hgetall', `${SESSION_NAME}:${token}`)
        ).to.eventually.have.property('_timestamp');
    });

    it('should be renewed with customised expiry time', async () => {
        const session = new Session(Object.assign(sessionConfig, { expiry: 2 }));
        const token = await session.start();
        await session.renew(20);
        const cache = new Cache({ redisClient });
        return expect(
            cache.command('ttl', `${SESSION_NAME}:${token}`)
        ).to.eventually.be.above(19);
    });

    it('should work without cookies', async () => {
        const sessionStarted = new Session(Object.assign(sessionConfig, { response: false, expiry: false }));
        const token = await sessionStarted.start();

        let sessionRequested = new Session(Object.assign(sessionConfig, { response: false }));
        promises.push(
            expect(sessionRequested.verify()).to.eventually.be.false
        );

        sessionRequested = new Session(
            Object.assign(sessionConfig, {
                response: false,
                request: {
                    headers: {
                        authorization: 'Bearer ' + token
                    }
                }
            })
        );

        promises.push(
            expect(sessionRequested.verify()).to.eventually.be.true
        );

        promises.push(
            sessionStarted.destroy(),
            sessionRequested.destroy()
        );

        return Promise.all(promises);
    });

    it('should set cookie correctly', async () => {
        const token = await session.start();

        expect(sessionConfig.response.setHeader.calledOnce).to.be.true;
        expect(
            sessionConfig.response.setHeader.calledWith(
                'Set-Cookie',
                `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=10; Path=/; HttpOnly`
            )
        ).to.be.true;

        let sessionRequested = new Session(sessionConfig);
        promises.push(
            expect(sessionRequested.verify()).to.eventually.be.true
        );

        const verified = await session.verifyAndRenew(undefined, 22);

        expect(verified).to.be.true;

        expect(
            sessionConfig.response.setHeader.calledWith(
                'Set-Cookie',
                `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=22; Path=/; HttpOnly`
            )
        ).to.be.true;

        await session.destroy();

        expect(
            sessionConfig.response.setHeader.calledWith(
                'Set-Cookie',
                `${COOKIE_NAME}=; Max-Age=0; Path=/; Expires=${new Date(0).toUTCString()}; HttpOnly`
            )
        ).to.be.true;

        return Promise.all(promises);
    });

    it('should work as an express middelware', async () => {
        express(
            // { ...sessionConfig, response: false, request: false }
            Object.assign({}, sessionConfig, { response: false, request: false })
        )(sessionConfig.request, sessionConfig.response, () => {});

        expect(sessionConfig.request).to.have.property('session');

        promises.push(
            expect(sessionConfig.request.session.verifyAndRenew()).to.eventually.be.false
        );

        await sessionConfig.request.session.init();

        promises.push(
            expect(sessionConfig.request.session.verify()).to.eventually.be.true
        );

        return Promise.all(promises);
    });

});
