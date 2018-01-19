'use strict';

// const sinon = require('sinon');
const expect = require('chai').expect;
const config = require('../test.config.js');

process.on('unhandledRejection', console.error);

describe('Amqp Module', () => {

    const { Amqp } = require(`../${config.sourceFolder}/amqp`);
    // const { Amqp } = require('@coolgk/amqp');

    const amqp = new Amqp({
        url: config.amqp.url
    });

    after(function() {
        setTimeout(() => {
            amqp.closeConnection();
        }, 1000);
    });

    it('should consumer message that does not require a response', (done) => {
        const stringMessage = 'ignore response';
        const route = Date.now() + Math.random();

        amqp.consume(({rawMessage, message}) => {
            expect(stringMessage).to.equal(message);
            done();
        }, { route }).then(() => {
            amqp.publish(stringMessage, undefined, { route });
        });
    });

    it('should consumer message that requires a response', (done) => {
        const jsonMessage = { a: 1, b: 'b' };
        const response = { response: 'response message' };
        const route = Date.now() + Math.random();

        amqp.consume(({rawMessage, message}) => {
            expect(jsonMessage).to.deep.equal(message);
            return response;
        }, { route }).then(() => {
            amqp.publish(jsonMessage, ({rawResponseMessage, responseMessage}) => {
                expect(response).to.deep.equal(responseMessage);
                done();
            }, { route });
        });
    });

    it('should consume messages from the correct routes', (done) => {
        const routes = {
            a: {
                message: Date.now() + Math.random(),
                name: Date.now() + Math.random(),
                response: Date.now() + Math.random()
            },
            b: {
                message: Date.now() + Math.random(),
                name: Date.now() + Math.random()
            }
        };

        Promise.all([
            amqp.consume(({rawMessage, message}) => {
                expect(routes.a.message).to.deep.equal(message);
                return routes.a.response;
            }, { route: routes.a.name }),
            amqp.consume(({rawMessage, message}) => {
                expect(routes.b.message).to.deep.equal(message);
            }, { route: routes.b.name })
        ]).then(() => {
            return Promise.all([
                amqp.publish(routes.b.message, undefined, { route: routes.b.name }),
                amqp.publish(routes.a.message, ({rawResponseMessage, responseMessage}) => {
                    expect(routes.a.response).to.deep.equal(responseMessage);
                    done();
                }, { route: routes.a.name })
            ]);
        });
    });

    // the route options should be able to take an array as input
    it('a single consumer should be able to consume messages from multiple routes');
    it('publisher should be send message to all consumers');
    it('publisher should be able to do round robin distribution');
    it('should fall back to catch all alternative exchange');

});
