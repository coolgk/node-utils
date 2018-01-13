/* tslint:disable */
/***
description: a simple RabbitMQ (amqp wrapper) class for publishing and consuming messages
keywords:
    - ampq
    - rabbitmq
dependencies:
    "@types/amqplib": "^0.5.5"
    "amqplib": "^0.5.2"
    "uuid": "^3.1.0"
    "@types/uuid": "^3.4.3"
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
documentation: |
    #### constructor(options)
    - Parameters
        - options
            - {string} options.url - connection string e.g. amqp://localhost
            - {string} [options.sslPem] - pem file path
            - {string} [options.sslCa] - sslCa file path
            - {string} [options.sslPass] - password
    - Return Value
        - void

    #### closeConnection()
    close the connection
    - Return Value
        - void

    #### publish(message, callback, { route = '#', exchangeName = 'defaultExchange' } = {})
    - Parameters
        - {*} message - message any type that can be JSON.stringify'ed
        - {function} [callback] - callback(message) for processing response from consumers
        - {object} [options]
            - {string} [options.route='#'] - route name
            - {string} [options.exchangeName='defaultExchange'] - exchange name
    - Return Value
        - Promise<boolean>

    #### consume(callback, { route = '#', queueName = 'defaultQueue', exchangeName = 'defaultExchange', exchangeType = 'topic', priority = 0, prefetch = 0 } = {})
    - Parameters
        - {function} callback - consumer(message) function should returns a promise
        - {object} [options]
        - {string} [options.route='#'] - exchange route
        - {string} [options.queueName='defaultQueue'] - queue name for processing request
        - {string} [options.exchangeName='defaultExchange'] - exchange name
        - {string} [options.exchangeType='topic'] - exchange type
        - {number} [options.priority=0] - priority, larger numbers indicate higher priority
        - {number} [options.prefetch=0] - 1 or 0, if to process request one at a time
    - Return Value
        - Promise
*/
/* tslint:enable */

// npm install -S @types/amqplib amqplib @types/uuid uuid

import { connect, Channel, Connection, Message, Replies } from 'amqplib';
import { v1 } from 'uuid';
import { readFile } from 'fs';

export interface IAmqpConfig {
    readonly url: string;
    readonly connect?: typeof connect;
    readonly uuid?: typeof v1;
    readonly sslPem?: string;
    readonly sslCa?: string;
    readonly sslPass?: string;
}

export interface IConsumeConfig {
    route?: string;
    queueName?: string;
    exchangeName?: string;
    priority?: number;
    prefetch?: number;
    exchangeType?: string;
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
     * @param {string} [options.route='#'] - route name
     * @param {string} [options.exchangeName='defaultExchange'] - exchange name
     * @return {promise<boolean>}
     */
    public publish (
        message: any,
        callback?: (message: IResponseMessage) => any,
        {route = '#', exchangeName = 'defaultExchange'}: {route?: string, exchangeName?: string} = {}
    ): Promise<boolean> {
        return this._getChannel().then((channel: Channel) => {
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
                            channel.deleteQueue(queue.queue);
                        }
                    });

                    return channel.publish(
                        exchangeName,
                        String(route),
                        Buffer.from(JSON.stringify(message)),
                        {
                            persistent: true,
                            correlationId: messageId,
                            replyTo: queue.queue
                        }
                    );
                });
            }
            return channel.publish(
                exchangeName,
                String(route),
                Buffer.from(JSON.stringify(message)),
                {
                    persistent: true
                }
            );
        });
    }

    /**
     * @param {function} callback - consumer(message) function should returns a promise
     * @param {object} [options]
     * @param {string} [options.route='#'] - exchange route
     * @param {string} [options.queueName=''] - queue name for processing request
     * @param {string} [options.exchangeName='defaultExchange'] - exchange name
     * @param {string} [options.exchangeType='topic'] - exchange type
     * @param {number} [options.priority=0] - priority, larger numbers indicate higher priority
     * @param {number} [options.prefetch=0] - 1 or 0, if to process request one at a time
     * @return {promise}
     */
    public consume (
        callback: (message: IMessage) => any,
        {
            route = '#',
            queueName = '',
            exchangeName = 'defaultExchange',
            exchangeType = 'topic',
            priority = 0,
            prefetch = 0
        }: IConsumeConfig = {}
    ): Promise<Replies.Consume> {
        return this._getChannel().then((channel: any) => {
            return channel.prefetch(prefetch).then(() => {
                return channel.assertExchange(exchangeName, exchangeType, {durable: true});
            }).then(() => {
                return channel.assertQueue(queueName, {durable: false});
            }).then((queue: Replies.AssertQueue) => {
                return channel.bindQueue(queue.queue, exchangeName, String(route)).then(
                    () => channel.consume(
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
                    )
                );
            });
        });
    }

    /**
     * @return {promise}
     * @ignore
     */
    private _getChannel (): any {
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
}

export default Amqp;
