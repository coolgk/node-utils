/* tslint:disable */
/***
description: a simple RabbitMQ (amqp wrapper) class for publishing and consuming messages
version: 2.0.3
keywords:
    - ampq
    - rabbitmq
dependencies:
    "@types/amqplib": "^0.5.5"
    "amqplib": "^0.5.2"
    "uuid": "^3.1.0"
    "@types/uuid": "^3.4.3"
    "@coolgk/array": "^2"
example: |
    import { Amqp } from '@coolgk/amqp';
    // OR
    // const { Amqp } = require('@coolgk/amqp');

    const amqp = new Amqp({
        url: 'amqp://localhost/vhost'
    });

    const message = {
        a: 1,
        b: 'b'
    };

    // CONSUMER MUST BE STARTED FIRST BEFORE PUSHLISHING ANY MESSAGE

    // consumer.js
    // consume message and return (send) a response back to publisher
    amqp.consume(({rawMessage, message}) => {
        console.log('consumer received', message); // consumer received ignore response
                                                   // consumer received { a: 1, b: 'b' }
        return {
            response: 'response message'
        }
    });

    // publisher.js
    // publish a message, no response from consumer
    amqp.publish('ignore response');

    // publish a message and handle response from consumer
    amqp.publish(message, ({rawResponseMessage, responseMessage}) => {
        console.log('response from consumer', responseMessage); // response from consumer { response: 'response message' }
    });


    // example to add:
    // consume from (multiple) routes
    // round robin consumers
    // direct route + a catch all consumer
*/
/* tslint:enable */

// npm install -S @types/amqplib amqplib @types/uuid uuid

import { connect, Channel, Connection, Message, Replies, Options } from 'amqplib';
import { v1 } from 'uuid';
import { readFile } from 'fs';
import { toArray } from '@coolgk/array';

export interface IAmqpConfig {
    readonly url: string;
    readonly connect?: typeof connect;
    readonly uuid?: typeof v1;
    readonly sslPem?: string;
    readonly sslCa?: string;
    readonly sslPass?: string;
}

export interface IConsumeConfig {
    routes?: string | string[];
    queueName?: string;
    exchangeName?: string;
    priority?: number;
    prefetch?: number;
    exchangeType?: string;
    fallbackExchange?: string;
}

export interface IMessage {
    rawMessage: Message | null;
    message: any;
}

export interface IResponseMessage {
    rawResponseMessage: Message | null;
    responseMessage: any;
}

export class Amqp {

    private _url: string;
    private _sslPem: string;
    private _sslCa: string;
    private _sslPass: string;
    private _uuid: typeof v1;
    private _connect: typeof connect;
    private _channel: any;
    private _connection: Connection;

    /**
     * @param {object} options
     * @param {string} options.url - connection string e.g. amqp://localhost
     * @param {string} [options.sslPem] - pem file path
     * @param {string} [options.sslCa] - sslCa file path
     * @param {string} [options.sslPass] - password
     */
    constructor (options: IAmqpConfig) {
        this._url = options.url;
        this._sslPem = options.sslPem || '';
        this._sslCa = options.sslCa || '';
        this._sslPass = options.sslPass || '';
        this._connect = options.connect || connect;
        this._uuid = options.uuid || v1;
    }

    /**
     * @return {void}
     */
    public closeConnection (): void {
        this._connection && this._connection.close();
    }

    /**
     * @param {*} message - message any type that can be JSON.stringify'ed
     * @param {function} [callback] - callback(message) for processing response from consumers
     * @param {object} [options]
     * @param {string|string[]} [options.routes=['#']] - route names
     * @param {string} [options.exchangeName='defaultExchange'] - exchange name
     * @return {promise<boolean[]>}
     */
    public publish (
        message: any,
        callback?: (message: IResponseMessage) => any,
        {routes = '#', exchangeName = 'defaultExchange'}: {routes?: string, exchangeName?: string} = {}
    ): Promise<boolean[]> {
        return this.getChannel().then((channel: Channel) => {
            if (callback) {
                const messageId = this._uuid();
                return channel.assertQueue('response' + messageId, {durable: false, autoDelete: true}).then((queue) => {
                    channel.consume(queue.queue, (rawResponseMessage: Message | null) => {
                        if (rawResponseMessage && rawResponseMessage.properties.correlationId === messageId) {
                            callback({
                                rawResponseMessage,
                                responseMessage: JSON.parse(rawResponseMessage.content.toString())
                            });
                            channel.ack(rawResponseMessage);
                        }
                    });

                    return this._publish(
                        channel,
                        exchangeName,
                        routes,
                        message,
                        {
                            persistent: true,
                            correlationId: messageId,
                            replyTo: queue.queue
                        }
                    );
                });
            }

            return this._publish(
                channel,
                exchangeName,
                routes,
                message,
                {
                    persistent: true
                }
            );
        });
    }

    /* tslint:disable */
    /**
     * @param {function} callback - consumer(message) function should returns a promise
     * @param {object} [options]
     * @param {string|string[]} [options.routes=['#']] - exchange routes
     * @param {string} [options.queueName=''] - queue name for processing messages. consumers with the same queue name process messages in round robin style
     * @param {string} [options.exchangeName='defaultExchange'] - exchange name
     * @param {string} [options.exchangeType='topic'] - exchange type
     * @param {number} [options.priority=0] - priority, larger numbers indicate higher priority
     * @param {number} [options.prefetch=1] - 1 or 0, if to process request one at a time
     * @return {promise}
     */
    /* tslint:enable */
    public consume (
        callback: (message: IMessage) => any,
        {
            routes = ['#'],
            queueName = '',
            exchangeName = 'defaultExchange',
            exchangeType = 'topic',
            priority = 0,
            prefetch = 1,
            fallbackExchange = ''
        }: IConsumeConfig = {}
    ): Promise<Replies.Consume[]> {
        return this.getChannel().then((channel: any) => {
            return channel.prefetch(prefetch).then(() => {
                return channel.assertExchange(
                    exchangeName,
                    exchangeType,
                    {
                        durable: false,
                        arguments: fallbackExchange ? { 'alternate-exchange': fallbackExchange } : {}
                    }
                );
            }).then(() => {
                // when the connection that declared it closes,
                // the queue will be deleted because it is declared as exclusive.
                return channel.assertQueue(queueName, {durable: false, exclusive: !queueName});
            }).then((queue: Replies.AssertQueue) => {
                const promises = [];
                for (const route of toArray(routes)) {
                    promises.push(channel.bindQueue(queue.queue, exchangeName, String(route)));
                }
                return Promise.all(promises).then(
                    () => {
                        return channel.consume(
                            queue.queue,
                            (rawMessage: Message | null) => {
                                Promise.resolve(
                                    callback({
                                        rawMessage,
                                        message: JSON.parse((rawMessage as Message).content.toString())
                                    })
                                ).then((response: any = '') => {
                                    if (rawMessage
                                        && rawMessage.properties.replyTo && rawMessage.properties.correlationId) {
                                        channel.sendToQueue(
                                            rawMessage.properties.replyTo,
                                            Buffer.from(JSON.stringify(response)),
                                            {
                                                persistent: true,
                                                correlationId: rawMessage.properties.correlationId
                                            }
                                        );
                                    }
                                    channel.ack(rawMessage as Message);
                                });
                            },
                            { priority }
                        );
                    }
                );
            });
        });
    }

    /**
     * @return {promise} - promise<channel>
     */
    public getChannel (): any {
        if (!this._channel) {
            if (this._sslPem) {
                return this._channel = new Promise((resolve, reject) => {
                    readFile(
                        this._sslPem,
                        (error, sslPem) => error ? reject(error) : resolve({
                            key: sslPem,
                            cert: sslPem,
                            passphrase: this._sslPass
                        })
                    );
                }).then(
                    (options) => new Promise((resolve, reject) => {
                        readFile(
                            this._sslCa,
                            (error, sslCA) => error ? reject(error) : {...options, ca: [sslCA]}
                        );
                    })
                ).then(
                    (options) => this._connect(this._url, options).then(
                        (connection) => (this._connection = connection).createChannel()
                    )
                );
            } else {
                return this._channel = this._connect(this._url).then(
                    (connection) => (this._connection = connection).createChannel()
                );
            }
        }
        return this._channel;
    }

    /**
     * @ignore
     */
    private _publish (
        channel: Channel, exchangeName: string, routes: string | string[], message: any, options: Options.Publish
    ): Promise<boolean[]> {
        const promises = [];

        for (const route of toArray(routes)) {
            promises.push(
                channel.publish(
                    exchangeName,
                    String(route),
                    Buffer.from(JSON.stringify(message)),
                    options
                )
            );
        }

        return Promise.all(promises);
    }
}

export default Amqp;
