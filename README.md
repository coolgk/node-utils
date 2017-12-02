# utils

- [base64](#base64)
- [bcrypt](#bcrypt)
- [queue](#queue)
- [cache](#cache)
- [captcha](#captcha)
- [request](#request)
- [tmp](#tmp)
- [csv](#csv)
- [email](#email)
- [ampq](#ampq)
- [pdf](#pdf)
- [token](#token)
- [unit](#unit)
- [url](#url)
- [string](#string)
- [array](#array)
- [number](#number)

## ampq
a simple RabbitMQ class for publishing and consuming messages
```JavaScript
/**
 * @param {object} options
 * @param {string} options.url - connection string e.g. amqp://localhost
 * @param {string} [options.sslPem] - pem file path
 * @param {string} [options.sslCa] - sslCa file path
 * @param {string} [options.sslPass] - password
 */
constructor(options) {}

closeConnection() {}

/**
 * @param {string} message - message string
 * @param {function} [callback] - callback(message) for processing response from consumers
 * @param {object} [options]
 * @param {string} [options.route='#'] - route name
 * @param {exchangeName} [options.route='defaultExchange'] - exchange name
 * @return {promise}
 */
publish(message, callback, { route = '#', exchangeName = 'defaultExchange' } = {}) {}

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
consume(callback, { route = '#', queueName = 'defaultQueue', exchangeName = 'defaultExchange', exchangeType = 'topic', priority = 0, prefetch = 0 } = {}) {}

// Example

import { Amqp } from '@coolgk/utils/amqp';
// OR
// const { Amqp } = require('@coolgk/utils/amqp');

const amqp = new Amqp({
    url: 'amqp://localhost/vhost'
});

const message = {
    a: 1,
    b: 'b'
};

// publisher.js
// publish a message, no response from consumer
amqp.publish('ignore response');

// publish a message and handle response from consumer
amqp.publish(message, ({rawResponseMessage, responseMessage}) => {
    console.log('response from consumer', responseMessage); // response from consumer { response: 'response message' }
});

// consumer.js
// consume message and return (send) a response back to publisher
amqp.consume(({rawMessage, message}) => {
    console.log('consumer received', message); // consumer received ignore response
                                               // consumer received { a: 1, b: 'b' }
    return {
        response: 'response message'
    }
});
```

## base64
base64 encoded decode functions
```JavaScript
/**
 * @param {string} data - string to encode
 * @return {string}
 */
function encode (data = '') {}

/**
 * @param {string} data - encoded hash
 * @return {string}
 */
function decode (data = '') {}

/**
 * @param {string} data - string to encode
 * @return {string}
 */
function encodeUrl (data = '') {}

/**
 * @param {string} data - base64 encoded url to decode
 * @return {string}
 */
decodeUrl (data = '') {}

// Example

import { encode, decode, encodeUrl, decodeUrl } from '@coolgk/utils/base64';
// OR
// const { encode, decode, encodeUrl, decodeUrl } = require('@coolgk/utils/base64');

const a = 'https://www.google.co.uk/?a=b'
const hash = encode(a);
const urlHash = encodeUrl(a);

console.log(a); // https://www.google.co.uk/?a=b
console.log(hash); // aHR0cHM6Ly93d3cuZ29vZ2xlLmNvLnVrLz9hPWI=
console.log(decode(hash)); // https://www.google.co.uk/?a=b

console.log(urlHash); // aHR0cHM6Ly93d3cuZ29vZ2xlLmNvLnVrLz9hPWI
console.log(decodeUrl(urlHash)); // https://www.google.co.uk/?a=b
```

## bcrypt
```JavaScript
import { encrypt, verify } from './bcrypt';

const password = 'abc123';

encrypt(password).then((hash) => {
    verify(password, hash).then(console.log);

    verify(password, 'invalidhash').then(console.log, console.error);

    verify('invalidpass', hash).then(console.log);
});
```

## queue
```JavaScript
import { queue } from './queue';

function a (x) {
    console.log('start a');
    return new Promise((resolve) => setTimeout(() => { console.log('end a', x); resolve('a') }, 1300));
}

function b (x) {
    console.log('start b');
    return new Promise((resolve) => setTimeout(() => { console.log('end b', x); resolve('b') }, 1200));
}

function c (x) {
    console.log('start c');
    return new Promise((resolve) => setTimeout(() => { console.log('end c', x); resolve('c') }, 100));
}

// call a, b, c in order i.e. b will not start until a resolves
queue(a);
queue(b);
queue(c);

// call a 5 times, each will wait until previous call resolves
[1,2,3,4,5].forEach(() => {
    queue(a)
});

// run 3 jobs at a time
[1,2,3,4,5,6,7,8,9,10].forEach(() => {
    queue(a, 3)
});
```

## cache
```JavaScript
import { Cache, CacheConfig } from './cache';
import { createClient } from 'redis';

const client = createClient({
    host: 'localhost',
    port: 6379,
    password: '---'
});

const config: CacheConfig = {
    redisClient: client
};

const cache = new Cache(config);

cache.set('abc', {a: 1}, 1).then(console.log); // 'OK'

cache.get('abc').then(console.log); // { a: 1 }

setTimeout(() => {
    cache.get('abc').then(console.log); // null
    client.quit();
}, 1500);

cache.getSetIfNull(
    'abc',
    () => Promise.resolve('data'),
    10
).then((v) => {
    console.log(v); // { a: 1 }
});
```

## captcha
```JavaScript
import { Captcha } from './captcha';

const captcha = new Captcha({
    secret: '---'
});

captcha.verify('input_response', 'ip').then((response) => {
    console.log(response);
});
```

## request

```JavaScript
import {send, get, post} from './request';

get('https://httpbin.org/get?a=b').then((respose) => {
    console.dir(respose.statusCode, {colors:true});
    console.dir(respose.headers, {colors:true});
    console.dir(respose.data, {colors:true});
    // if respose.data is a json string, respose.json will return the json object
    console.dir(respose.json, {colors:true});
});

post('https://httpbin.org/post?a=b').then((respose) => {
    console.dir(respose.statusCode, {colors:true});
    console.dir(respose.headers, {colors:true});
    console.dir(respose.data, {colors:true});
    // if respose.data is a json string, respose.json will return the json object
    console.dir(respose.json, {colors:true});
});
```

## tmp
```JavaScript
import { generateFile, generateDir, generateTmpName } from './tmp';

generateFile({dir: '/tmp/test'}).then((r) => console.log('file', r));

generateDir({dir: '/tmp/test'}).then((r) => console.log('dir',r));

generateTmpName({dir: '/tmp/test'}).then((r) => console.log('name', r));
```

## csv
```JavaScript
import { CsvConfig, CsvReadConfig, CsvWriteConfig, Csv } from './csv';

const csv = new Csv({
    tmpConfig: { // optional
        dir: '/tmp/csv'
    }
});

const arrayData = [
    [1,2,3,4,5],
    [6,7,7,8,9],
    [0,5,8,90,65]
];

const objectData = [
    {col1: 'ab', col2: 'cd', col3: 'ef'},
    {col1: '2ab', col2: '2cd', col3: '2ef'},
    {col1: '3ab', col2: '3cd', col3: '3ef'}
];

csv.createFile(
    arrayData,
    {
        columns: ['column 1', 'column 2', 'column 3', 'h4', 'h5'],
        formatter: (row: any[]) => {
            return row.map((value) => 'formatted-' + value);
        }
    }
).then((csvFilePath) => {
    console.log(csvFilePath);
    read(csvFilePath, ['column 1', 'column 2', 'column 3', 'h4', 'h5']);
});

csv.createFile(
    objectData,
    {
        columns: ['col1', 'col2', 'col3'],
        formatter: (row: {[propName: string]: any}) => {
            return [row.col1 + '+format', row.col2 + '+format', row.col3 + '+format'];
        }
    }
).then((csvFilePath) => {
    console.log(csvFilePath);
    read(csvFilePath, ['col1', 'col2', 'col3']);
});

function read (file, columns) {
    // with columns/headers
    const lines = csv.readFile(file, {columns: columns});
    lines.forEach(
        (lineArray, index) => {
            console.log(lineArray, index);
        },
        (total) => {
            console.log('read done, total:', total);
        }
    );

    // without columns/headers
    const lines2 = csv.readFile(file);
    lines2.forEach(
        (lineArray, index) => {
            console.log(lineArray, index);
        },
        (total) => {
            console.log('read done, total:', total);
        }
    );
}
```

## email
```JavaScript
import { Email } from './email';

const email = new Email({host: 'localhost'});

// OR
// import emailjs = require('emailjs');
// const email = new Email({
    // emailClient: emailjs.server.connect({host: 'localhost'})
// });

email.send({
    subject: 'hello this is email subject',
    from: {
            name: 'Daniel Gong',
            email: 'daniel.gong@example.com'
    },
    to: [
        {
            name: 'Dan Go',
            email: 'daniel.gong@example.com'
        },
        'daniel.gong@example.com'
    ],
    message: '<html><body><h1>test</h1>some message here <img src="cid:my-image" width="500" height="250"></body></html>',
    attachments: [
        {
            path: '/file/path/image.png',
            name: 'screenshot.png'
        },
        {
            path:"/file/path/image.png",
            headers:{"Content-ID": "<my-image>"}
        }
    ]
}).then((sentMessage) => {
    console.log(sentMessage);
}).catch((error) => {
    console.log(error);
});
```

## pdf
```JavaScript
import { Pdf } from './pdf';

const pdf = new Pdf({
    tmpConfig: {
        dir: '/tmp/pdf'
    }
});

pdf.createFromHtmlFile(
    '/tmp/test.html',
    {
        header: {
            height: '1cm',
            contents: "header <strong style='color: red'>Page ${pageNumber} of ${numberOfPages} - ${pageNumber}</strong>"
        },
        footer: {
            height: '1cm',
            contents: 'footer <strong>Page ${pageNumber} of ${numberOfPages}</strong>'
        },
        margin: '0.5cm'
    }
).then((pdfFile) => {
    console.log(pdfFile);
});

const htmlCode = `<!DOCTYPE html><html><head>
        <title>CCES</title>
        <style>
            .pagebreak { page-break-after: always; }
            h2, h1 { color: red }
        </style>
    </head>
    <body>
        <div>
            <h1>page 1</h1>
            <p>some text <img src='https://dummyimage.com/600x400/3bbda9/f516ae.jpg'></p>
        </div>
        <div class="pagebreak"></div>
        <div>
            <h2>page 2</h2>
            <table>
                <tr>
                    <td>texgt</td>
                    <td>text</td>
                </tr>
            </table>
        </div>
    </body>
</html>`;

pdf.createFromHtmlString(htmlCode).then((pdfFile) => {
    console.log(pdfFile);
});
```

## token
```JavaScript
import { Token } from './token';
import { createClient } from 'redis';
// OR
// const Token = require('./token');
// const createClient = require('redis').createClient;

(async () => {

    const redisClient = createClient({
        host: 'localhost',
        port: 6379,
        password: '----'
    });

    const token = new Token({
        redisClient: redisClient,
        expiry: 5,
        token: 'abcde'
    });

    console.log(
        await token.verify()
    ) // false

    await token.renew();

    console.log(
        await token.verify()
    ) // true

    console.log(
        await token.get('var1');
    ); // null

    console.log(
        await token.getAll()
    ); // {}

    await token.set('var1', {a: 'var1', b: false});

    console.log(
        await token.get('var1');
    ); // {a: 'var1', b: false}

    await token.set('var2', 'string var 2');

    console.log(
        await token.getAll()
    ); // { var1: { a: 'var1', b: false }, var2: 'string var 2' }

    await token.delete('var2');

    console.log(
        await token.get('var2');
    ); // null

    console.log(
        await token.getAll()
    ); // { var1: { a: 'var1', b: false } }

    await token.destroy();

    console.log(
        await token.verify()
    ) // false

    console.log(
        await token.get('var1');
    ); // null

    console.log(
        await token.getAll()
    ); // {}

    redisClient.quit();
})()
```

## unit
```JavaScript
import { bytesToString, millisecondsToString } from './unit';

console.log(
    bytesToString(500),
    bytesToString(5000),
    bytesToString(5000000),
    bytesToString(5000000000),
    bytesToString(5000000000000),
    bytesToString(5000000000000000),
    bytesToString(5000000000000000000),
);

console.log('1 sec', millisecondsToString(1 * 1000));
console.log('1 min', millisecondsToString(60 * 1000));
console.log('100 sec', millisecondsToString(100 * 1000));
console.log('3 hrs', millisecondsToString(60 * 60 * 3 * 1000));
console.log('1.5 days', millisecondsToString(60 * 60 * 24 * 1.5 * 1000));
console.log('65 days', millisecondsToString(60 * 60 * 24 * 65 * 1000));
console.log('365 days', millisecondsToString(60 * 60 * 24 * 365 * 1000));
console.log('500 days', millisecondsToString(60 * 60 * 24 * 500 * 1000));
console.log('900 days', millisecondsToString(60 * 60 * 24 * 900 * 1000));
console.log('1900 days', millisecondsToString(60 * 60 * 24 * 1900 * 1000));
console.log('365001 days', millisecondsToString(60 * 60 * 24 * 365001 * 1000));
```

## url
```JavaScript
import { getParams } from './url';

const url = '/123';
const pattern = '/:id';

console.log(getParams(url, pattern));

const url2 = '/123/abc/456';
const pattern2 = '/:id/abc/:value';

console.log(getParams(url2, pattern2));

const url3 = '/123/456';
const pattern3 = ':id/:value';

console.log(getParams(url3, pattern3));
```

## string
```JavaScript
import { stripTags, escapeHtml, unescapeHtml } from './string';

const str = '<h1>test</h1><script>alert(1)</script>'

console.log(stripTags(str));
console.log(escapeHtml(str));
console.log(unescapeHtml(escapeHtml(str)));

console.log(prepad0(7, 2));
console.log(prepad0(70, 3));
console.log(prepad0(70, 4));
console.log(prepad0(1, 4));
console.log(prepad0(1000, 2));
```

## array
```JavaScript
import { toArray } from './array';

const a = undefined;
const b = false;
const c = '';
const d = [1,2,3];
const e = {a:1};

console.log(toArray(a));
console.log(toArray(b));
console.log(toArray(c));
console.log(toArray(d));
console.log(toArray(e));
```

## number
```JavaScript
import { round } from './number';

console.log(round(1.3923, 2));
console.log(round(100, 2));
console.log(round(100.1264, 2));
console.log(round(100.958747, 4));
```
