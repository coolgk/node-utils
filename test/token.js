'use strict';

const sinon = require('sinon');
const chai = require('chai');
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('Token Module', function () {

    const { Token, TokenError, DEFAULT_PREFIX } = require(`../${config.sourceFolder}/token`);

    let redisClient;
    let token;

    before(() => {
        redisClient = require('redis').createClient({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password
        });

        token = new Token({
            redisClient: redisClient,
            expiry: 1,
            token: `token:test:${Math.random()}`
        });
    });

    after(async () => {
        await token.destroy();
        redisClient.quit();
    });

    it('should not be able to set var & be invalid before renew', () => {
        return Promise.all([
            expect(token.set('_timestamp', 231)).to.eventually.have.property('error', TokenError.RESERVED_NAME),
            expect(token.set('ab', 121)).to.eventually.have.property('error', TokenError.EXPIRED_TOKEN),
            expect(token.verify()).to.eventually.be.false
        ]);
    });

    it('should be valid after renew', async () => {
        await token.renew();
        return expect(token.verify()).to.eventually.be.true;
    });

    it('should get var value as null before var is set', async () => {
        await token.renew();
        return expect(token.get('var1')).to.eventually.be.null;
    });

    it('should have empty object value before any var is set', async () => {
        await token.renew();
        return expect(token.getAll()).to.eventually.deep.equal({});
    });

    it('should have values after values are set', async () => {
        await token.set('var1', {a: 'var1', b: false});

        expect(await token.set('_timestamp', 123)).to.deep.equal({error: TokenError.RESERVED_NAME});

        expect(await token.get('var1')).to.deep.equal({a: 'var1', b: false});

        await token.set('var2', 'string var 2');

        return expect(token.getAll()).to.eventually.deep.equal(
            { var1: { a: 'var1', b: false }, var2: 'string var 2' }
        );
    });

    it('should delete var', async () => {
        await token.delete('var2');
        return Promise.all([
            expect(token.get('var2')).to.eventually.be.null,
            expect(token.getAll()).to.eventually.deep.equal({ var1: { a: 'var1', b: false } })
        ]);
    });

    it('should expire token & not be able to set var when token expires', (done) => {
        token.renew(0).then(
            () => token.renew(1)
        ).then(() => {
            return Promise.all([
                token.set('var1', {a: 'var1', b: false}),
                token.set('var2', 'string var 2')
            ])
        }).then(() => {
            setTimeout(() => {
                Promise.all([
                    expect(token.set()).to.eventually.have.property('error', TokenError.EXPIRED_TOKEN),
                    expect(token.verify()).to.eventually.be.false,
                    expect(token.get('var1')).to.eventually.be.null,
                    expect(token.getAll()).to.eventually.deep.equal({})
                ]).then(() => done()).catch(done);
            }, 1000);
        });
    });

    it('should destroy token', async () => {
        const token2 = new Token({
            redisClient: redisClient,
            expiry: 2,
            token: `token:test:${Math.random()}`
        });

        await token2.set('var1', {a: 'var1', b: false});
        await token2.set('var2', 'string var 2');

        await token2.destroy();
        return Promise.all([
            expect(token2.verify()).to.eventually.be.false,
            expect(token2.get('var1')).to.eventually.be.null,
            expect(token2.getAll()).to.eventually.deep.equal({})
        ]);
    });

    it('should set error value when token string is not set', () => {
        const invalidToken = new Token({ redisClient: redisClient });
        return Promise.all([
            expect(invalidToken.set()).to.eventually.have.property('error', TokenError.INVALID_TOKEN),
            expect(invalidToken.renew()).to.eventually.have.property('error', TokenError.INVALID_TOKEN),
            expect(invalidToken.delete()).to.eventually.have.property('error', TokenError.INVALID_TOKEN)
        ]).then(() => invalidToken.destroy());
    });

    it('should use the correct variable name when setting cache after token change', (done) => {
        const cache = {
            command: sinon.spy()
        };

        const tokenString = `token:test:${Math.random()}`;

        const token = new Token({
            cache,
            expiry: 1,
            token: tokenString
        });

        sinon.stub(token, 'get').returns(1);

        token.set('abc', 123).then(() => {
            expect(cache.command.calledOnce).to.be.true;
            expect(
                cache.command.calledWithExactly(
                    'hset',
                    `${DEFAULT_PREFIX}:${tokenString}`,
                    'abc',
                    JSON.stringify(123)
                )
            ).to.be.true;
        }).then(() => {
            const newToken = `new:${Math.random()}`
            token.setToken(newToken);

            return token.set('abc', 123).then(() => {
                expect(cache.command.calledTwice).to.be.true;
                expect(
                    cache.command.calledWithExactly(
                        'hset',
                        `${DEFAULT_PREFIX}:${newToken}`,
                        'abc',
                        JSON.stringify(123)
                    )
                ).to.be.true;
            });
        }).then(() => done()).catch(done);
    });

    it(
        'this._name should not be modified by classes that extends this class i.e. this._name should be private',
        (done) => {
            const cache = {
                command: sinon.spy()
            };

            const tokenString = `token:test:${Math.random()}`;

            const token = new Token({
                cache,
                expiry: 1,
                token: tokenString
            });

            sinon.stub(token, 'get').returns(1);

            token._token = 'kkk';

            token.set('abc', 123).then(() => {
                expect(
                    cache.command.calledWithExactly(
                        'hset',
                        `${DEFAULT_PREFIX}:${tokenString}`,
                        'abc',
                        JSON.stringify(123)
                    )
                ).to.be.true;
                done();
            }).catch(done);
        }
    );

});
