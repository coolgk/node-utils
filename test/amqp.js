'use strict';

// const sinon = require('sinon');
const expect = require('chai').expect;
const config = require('../test.config.js');

process.on('unhandledRejection', console.error);

describe('Amqp Module', () => {

    const { Amqp } = require(`../${config.sourceFolder}/amqp`);
    // const { Amqp } = require('@coolgk/amqp');

    let amqp;
    const connections = [];

    beforeEach(() => {
        amqp = new Amqp({
            url: config.amqp.url
        });
    });

    afterEach(function(done) {
        setTimeout(() => {
            amqp.closeConnection();
            done();
        }, 300);
    });

    it('should consume message that does not require a response', (done) => {
        const stringMessage = 'ignore response';
        const route = Date.now() + Math.random();

        amqp.consume(({rawMessage, message}) => {
            expect(stringMessage).to.equal(message);
            done();
        }, { route }).then(() => {
            amqp.publish(stringMessage, undefined, { route });
        });
    });

    it('should consume message that requires a response', (done) => {
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
            }, { routes: routes.a.name }),
            amqp.consume(({rawMessage, message}) => {
                expect(routes.b.message).to.deep.equal(message);
            }, { routes: routes.b.name })
        ]).then(() => {
            return Promise.all([
                amqp.publish(routes.b.message, undefined, { routes: routes.b.name }),
                amqp.publish(routes.a.message, ({rawResponseMessage, responseMessage}) => {
                    expect(routes.a.response).to.deep.equal(responseMessage);
                    done();
                }, { routes: routes.a.name })
            ]);
        });
    });

    // the route options should be able to take an array as input
    it('a single consumer should be able to consume messages from multiple routes', (done) => {
        let callCount = 0;
        const routes = {
            a: {
                message: Date.now() + Math.random(),
                name: Date.now() + Math.random(),
                response: Date.now() + Math.random()
            },
            b: {
                name: Date.now() + Math.random()
            }
        };

        Promise.all([
            amqp.consume(
                ({message}) => {
                    expect(routes.a.message).to.deep.equal(message);
                    return routes.a.response;
                },
                {
                    routes: routes.a.name,
                }
            ),
            amqp.consume(
                ({message}) => {
                    expect(routes.a.message).to.deep.equal(message);
                    return routes.a.response;
                },
                {
                    routes: routes.b.name,
                }
            )
        ]).then(() => {
            return new Promise((resolve) => {
                amqp.publish(routes.a.message, ({responseMessage}) => {
                    expect(routes.a.response).to.deep.equal(responseMessage);
                    if (++callCount > 1) {
                        resolve();
                    }
                }, { routes: [routes.a.name, routes.b.name] })
            });
        }).then(() => done()).catch(done);
    });

    it('publisher should send message to all consumers', (done) => {
        let callCount = 0;
        const routes = {
            a: {
                message: Date.now() + Math.random(),
                name: Date.now() + Math.random(),
                response: Date.now() + Math.random()
            }
        };

        Promise.all([
            amqp.consume(
                ({message}) => {
                    expect(routes.a.message).to.deep.equal(message);
                    return routes.a.response;
                },
                {
                    routes: routes.a.name,
                }
            ),
            amqp.consume(
                ({message}) => {
                    expect(routes.a.message).to.deep.equal(message);
                    return routes.a.response;
                }
            )
        ]).then(() => {
            return new Promise((resolve) => {
                amqp.publish(routes.a.message, ({responseMessage}) => {
                    expect(routes.a.response).to.deep.equal(responseMessage);
                    if (++callCount > 1) {
                        resolve();
                    }
                }, { routes: routes.a.name });
            });
        }).then(() => done()).catch(done);
    });

    it('publisher should be able to do round robin distribution', (done) => {

        let responseCount = 0;

        const routes = {
            a: {
                message: Date.now() + Math.random(),
                name: Date.now() + Math.random(),
                response: Date.now() + Math.random()
            },
            b: {
                message: Date.now() + Math.random(),
                name: Date.now() + Math.random(),
                response: Date.now() + Math.random()
            }
        };

        const responseMessages = [];
        Promise.all([
            amqp.consume(
                ({message}) => {
                    // expect(routes.a.message).to.deep.equal(message);
                    return routes.a.response;
                },
                {
                    queueName: 'roundRobin',
                    routes: routes.a.name
                }
            ),
            amqp.consume(
                ({message}) => {
                    // expect(routes.b.message).to.deep.equal(message);
                    return routes.b.response;
                },
                {
                    queueName: 'roundRobin',
                    routes: routes.a.name
                }
            )
        ]).then((messages) => {
            return Promise.all([
                new Promise((resolve) => {
                    amqp.publish(routes.a.message, ({responseMessage}) => {
                        responseMessages.push(responseMessage);
                        // expect(routes.a.response).to.deep.equal(responseMessage);
                        responseCount++;
                        resolve();
                    }, { routes: routes.a.name })
                }),
                new Promise((resolve) => {
                    amqp.publish(routes.b.message, ({responseMessage}) => {
                        responseMessages.push(responseMessage);
                        // expect(routes.b.response).to.deep.equal(responseMessage);
                        responseCount++;
                        resolve();
                    }, { routes: routes.a.name })
                })
            ]);
        }).then(() => {
            expect(responseMessages).to.have.lengthOf(2);
            expect(responseMessages).to.have.members([routes.a.response, routes.b.response]);
            expect(responseCount).to.equal(2);
            done();
        }).catch(done);

    });

    it('should fall back to catch all alternative exchange', (done) => {
        const routes = {
            a: {
                message: Date.now() + Math.random(),
                name: Date.now() + Math.random(),
                response: Date.now() + Math.random()
            },
            b: {
                message: Date.now() + Math.random(),
                name: Date.now() + Math.random(),
                response: Date.now() + Math.random()
            }
        };

        Promise.all([
            amqp.consume(
                ({message}) => {
                    expect(routes.a.message).to.deep.equal(message);
                    return routes.a.response;
                },
                {
                    exchangeName: 'directTest',
                    exchangeType: 'direct',
                    routes: routes.a.name,
                    fallbackExchange: 'defaultExchange'
                }
            ),
            amqp.consume(
                ({message}) => {
                    expect(routes.b.message).to.deep.equal(message);
                    return routes.b.response;
                }
            )
        ]).then(() => {
            return Promise.all([
                new Promise((resolve) => {
                    amqp.publish(routes.a.message, ({responseMessage}) => {
                        expect(routes.a.response).to.deep.equal(responseMessage);
                        resolve();
                    }, { routes: routes.a.name, exchangeName: 'directTest' })
                }),
                new Promise((resolve) => {
                     amqp.publish(routes.b.message, ({responseMessage}) => {
                        expect(routes.b.response).to.deep.equal(responseMessage);
                        resolve();
                    })
                })
            ]);
        }).then(() => {
            return amqp.getChannel().then((channel) => {
                channel.deleteExchange('directTest');
            }).then(() => done());
        }).catch(done);

    });

});
