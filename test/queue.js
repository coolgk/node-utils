'use strict';

// const sinon = require('sinon');
const chai = require('chai');
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const config = require('../test.config.js');

describe('Queue Module', function () {

    const { queue } = require(`../${config.sourceFolder}/queue`);

    function a (x) {
        return new Promise((resolve) => setTimeout(() => resolve('a'), 100));
    }

    function b (x) {
        return new Promise((resolve) => setTimeout(() => resolve('b'), 50));
    }

    function c (x) {
        return new Promise((resolve) => setTimeout(() => resolve('c'), 10));
    }

    it('should call one function at a time in order', (done) => {
        const order = [];

        // call a, b, c in order i.e. b will not start until a resolves
        const pa = queue(
            () => a().then(() => order.push('a'))
        );
        const pb = queue(
            () => b().then(() => order.push('b'))
        );
        const pc = queue(
            () => c().then(() => order.push('c'))
        );

        Promise.all([pa, pb, pc]).then(() => {
            expect(order).to.deep.equal(['a', 'b', 'c']);
        }).then(() => {
            // call a 5 times, each will wait until previous call resolves
            const loopOrder = [];
            return Promise.all(
                [1,2,3,4,5].map((number) => {
                    return queue(
                        () => b().then(() => loopOrder.push(number))
                    );
                })
            ).then(() => {
                expect(loopOrder).to.deep.equal([1,2,3,4,5]);
                done();
            });
        }).catch(done);
    });

    it('should limit the number of functions run in parallel', (done) => {
        // run 3 jobs at a time
        const timeLog = [];
        const limit = 3;
        Promise.all(
            [1,2,3,4,5,6,7,8,9,10].map((num) => {
                return queue(
                    () => b().then(() => timeLog.push(Date.now())),
                    limit
                );
            })
        ).then(() => {
            // the time difference between jobs in a group must be less than the difference between groups
            const groupedLog = [];

            while (timeLog.length) {
                const group = timeLog.splice(0, limit);
                groupedLog.push({
                    time: group[0],
                    diff: (group[1] || group[0]) - group[0]
                });
            }

            groupedLog.forEach((log, index) => {
                const nextLog = groupedLog[index + 1];
                if (nextLog) {
                    expect(log.diff).to.be.lessThan(nextLog.time - log.time);
                }
            });

            done();
        }).catch(done);
    });

});
