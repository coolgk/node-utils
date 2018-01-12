'use strict';

// const sinon = require('sinon');
const chai = require('chai');
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('Cache Module', function () {
    // this.timeout(4000);

    const { Cache } = require(`../${config.sourceFolder}/cache`);
    const { createClient } = require('redis');

    const client = createClient({
        host: config.redis.url,
        port: config.redis.port,
        password: config.redis.password
    });

    const cache = new Cache({
        redisClient: client
    });

    const fieldNames = [
        `aaa${Math.random()}`,
        `bbb${Math.random()}`,
        `ccc${Math.random()}`,
        `ddd${Math.random()}`,
        `eee${Math.random()}`,
        `fff${Math.random()}`,
        `ggg${Math.random()}`
    ];

    after(() => {
        cache.command('del', fieldNames).then((response) => {
            client.quit();
        });
    });

    it('should set value', (done) => {
        const value = {a: 1};
        cache.set(fieldNames[0], value, 1).then((response) => {
            expect(response).to.equal('OK');
            expect(cache.get(fieldNames[0])).to.eventually.deep.equal(value).and.notify(done);
        }).catch(done);
    });

    it('should expire value', (done) => {
        cache.set(fieldNames[1], 123, 1).then(() => {
            setTimeout(() => {
                expect(cache.get(fieldNames[1])).to.eventually.be.null.and.notify(done);
            }, 1100);
        });
    });

    it('should set value if cannot find in cache', (done) => {
        const value = 333;
        const newValue = 'data';
        cache.set(fieldNames[2], value, 1).then(() => {
            const result = expect(cache.getSetIfNull(
                fieldNames[2],
                () => Promise.resolve(newValue),
                1
            )).to.eventually.equal(value);

            setTimeout(() => {
                cache.getSetIfNull(
                    fieldNames[2],
                    () => Promise.resolve(newValue),
                    1
                ).then((cacheValue) => {
                    expect(cacheValue).to.equal(newValue);
                    expect(cache.get(fieldNames[2])).to.eventually.equal(newValue).and.notify(done);
                }).catch(done);
            }, 1100);

            return result;
        }).catch(done);
    });

    it('should set without a expiry time', (done) => {
        const value = 'wwwwww';
        const newValue = 'afsda';
        cache.set(fieldNames[3], value).then((response) => {
            return Promise.all([
                expect(cache.get(fieldNames[3])).to.eventually.equal(value),
                expect(cache.getSetIfNull(
                    fieldNames[3],
                    () => Promise.resolve(newValue)
                )).to.eventually.equal(value)
            ]).then(() => done());
        }).catch(done);
    });

    it('should delete', (done) => {
        const value = 'dafsdf';
        Promise.all([
            cache.set(fieldNames[4], value, 1),
            cache.set(fieldNames[5], value, 1),
            cache.set(fieldNames[6], value, 1)
        ])
        .then(() => cache.delete(fieldNames[4]))
        .then(
            () => Promise.all([
                expect(cache.get(fieldNames[4])).to.eventually.be.null,
                expect(cache.get(fieldNames[5])).to.eventually.equal(value),
                expect(cache.get(fieldNames[6])).to.eventually.equal(value)
            ])
        )
        .then(() => cache.delete([fieldNames[5], fieldNames[6]]))
        .then(
            () => Promise.all([
                expect(cache.get(fieldNames[5])).to.eventually.be.null,
                expect(cache.get(fieldNames[6])).to.eventually.be.null
            ])
        ).then(() => done()).catch(done);
    });
});
