/*
import { Amqp } from './amqp';

const amqp = new Amqp({
	url: 'amqp://cpbmqvjl:Df8PA7nGmW5wWrKpoINIDP9OowpMf0YA@gopher.rmq.cloudamqp.com/cpbmqvjl'
});

const message = {
	a: 1,
	b: 'b'
};

amqp.publish('ignore no response');

amqp.publish(message, ({rawResponseMessage, responseMessage}) => {
	console.log('response from consumer', responseMessage);
});

amqp.consume(({rawMessage, message}) => {
	console.log('consumer received', message);
	return {
		response: 123123
	}
});
*/

// npm install -S @types/amqplib amqplib @types/uuid uuid

import { connect, Channel, Connection, Message, Replies } from 'amqplib';
import { v1 } from 'uuid';
import { readFile } from 'fs';

export interface AmqpConfig {
	readonly url: string;
	readonly connect?: typeof connect;
	readonly uuid?: typeof v1;
	readonly sslPem?: string;
	readonly sslCa?: string;
	readonly sslPass?: string;
}

export interface ConsumeConfig {
	route?: string;
	queueName?: string;
	exchangeName?: string;
	priority?: number;
	prefetch?: number;
	exchangeType?: string;
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
     * @param {function} [options.connect] - connect in amqplib library
     * @param {function} [options.uuid] - v1 in uuid library
     * @param {string} [options.sslPem] - pem file path
     * @param {string} [options.sslCa] - sslCa file path
     * @param {string} [options.sslPass] - password
     */
    constructor (options: AmqpConfig) {
        this._url = options.url;
        this._sslPem = options.sslPem;
        this._sslCa = options.sslCa;
        this._sslPass = options.sslPass;
        this._connect = options.connect || connect;
        this._uuid = options.uuid || v1;
    }

	/**
	 * @return {promise}
	 */
    private _getChannel (): any {
        if (!this._channel) {
            if (this._sslPem) {
                this._channel = new Promise((resolve, reject) => {
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
                this._channel = this._connect(this._url).then(
                    (connection) => (this._connection = connection).createChannel()
                );
            }
        }
        return this._channel;
    }

    closeConnection (): void {
        this._connection && this._connection.close();
    }

    /**
     * @param {string} message - message string
     * @param {function} [callback] - callback(message) for processing response from consumers
     * @param {object} [options]
     * @param {string} [options.route='#'] - route name
     * @param {exchangeName} [options.route='defaultExchange'] - exchange name
	 * @return {promise}
     */
    publish (
		message: any,
		callback?: ({rawResponseMessage: Message, responseMessage: any}) => any,
		{route = '#', exchangeName = 'defaultExchange'}: {route?: string, exchangeName?: string} = {}
	): Promise<boolean> {
        return this._getChannel().then((channel) => {
			if (callback) {
				const messageId = this._uuid();
				return channel.assertQueue('response' + messageId, {durable: false}).then((queue) => {
					channel.consume(queue.queue, (rawResponseMessage: Message) => {
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
						exchangeName ,
						route,
						Buffer.from(JSON.stringify(message)),
						{
							persistent: true,
							correlationId: messageId,
							replyTo: queue.queue
						}
					);
				})
			}
			return channel.publish(exchangeName, route, Buffer.from(JSON.stringify(message)), {persistent: true});
		});
    }

    /**
     * @param {function} callback - consumer(message) function should returns a promise
     * @param {object} [options]
     * @param {string} [options.route='#'] - exchange route
     * @param {string} [options.queueName='defaultQueue'] - queue name for processing request
     * @param {string} [options.exchangeName='defaultExchange'] - exchange name
     * @param {string} [options.exchangeType='topic'] - exchange type
     * @param {number} [options.priority=0] - priority, larger numbers indicate higher priority
     * @param {number} [options.prefetch=0] - 1 or 0, if to process request one at a time
	 * @return {promise}
     */
    consume (
		callback: ({rawMessage: Message, message: any}) => any,
		{
			route = '#',
			queueName = 'defaultQueue',
			exchangeName = 'defaultExchange',
			exchangeType = 'topic',
			priority = 0,
			prefetch = 0
		}: ConsumeConfig = {}
	): Promise<Replies.Consume> {
        return this._getChannel().then(
            (channel) => channel.prefetch(prefetch).then(
                () => channel.assertExchange(exchangeName, exchangeType, {durable: true})
            ).then(
                () => channel.assertQueue(queueName, {durable: true})
            ).then(
                (queue) => channel.bindQueue(queue.queue, exchangeName, route).then(
                    () => channel.consume(
                        queue.queue,
                        (rawMessage) => {
							Promise.resolve(
								callback({
									rawMessage,
									message: JSON.parse(rawMessage.content.toString())
								})
							).then((response) => {
								if (rawMessage.properties.replyTo && rawMessage.properties.correlationId) {
									channel.sendToQueue(
										rawMessage.properties.replyTo,
										Buffer.from(JSON.stringify(response)),
										{
											persistent: true,
											correlationId: rawMessage.properties.correlationId
										}
									);
								}
								channel.ack(rawMessage);
							});
                        },
                        {
                            priority: priority
                        }
                    )
                )
            )
        );
    }
}
