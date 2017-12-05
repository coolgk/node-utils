#### npm i -S @coolgk/utils

- [ampq](#ampq)
- [array](#array)
- [base64](#base64)
- [cache](#cache)
- [captcha](#captcha)
- [csv](#csv)
- [email](#email)
- [number](#number)
- [pdf](#pdf)
- [queue](#queue)
- [string](#string)
- [token](#token)
- [unit](#unit)
- [url](#url)
- [bcrypt](#bcrypt)
- [tmp](#tmp)
- [jwt](#jwt)

## ampq
a simple RabbitMQ class for publishing and consuming messages
#### Example
```JavaScript
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
#### Doc
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
 * @param {*} message - message any type that can be JSON.stringify'ed
 * @param {function} [callback] - callback(message) for processing response from consumers
 * @param {object} [options]
 * @param {string} [options.route='#'] - route name
 * @param {string} [options.exchangeName='defaultExchange'] - exchange name
 * @return {promise<boolean>}
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
```

## array
array utilities
#### Example
```JavaScript
import { toArray } from '@coolgk/utils/array';
// OR
// const { toArray } = require('@coolgk/utils/array');

const a = undefined;
const b = false;
const c = '';
const d = [1,2,3];
const e = {a:1};

console.log(toArray(a)); // []
console.log(toArray(b)); // [ false ]
console.log(toArray(c)); // [ '' ]
console.log(toArray(d)); // [ 1, 2, 3 ]
console.log(toArray(e)); // [ { a: 1 } ]
```
#### Doc
```JavaScript
/**
 * @param {*} data - any data to be type cast to array
 * @return {array}
 */
function toArray (data) {}
```

## base64
base64 encoded decode functions
#### Example
```JavaScript
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
#### Doc
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
```

## cache
a wrapper for redis
#### Example
```JavaScript
import { Cache } from '@coolgk/utils/cache';
import { createClient } from 'redis';
// OR
// const { Cache } = require('@coolgk/utils/cache');
// const { createClient } = require('redis');

const client = createClient({
    host: 'localhost',
    port: 12869,
    password: '----'
});

const cache = new Cache({
    redisClient: client
});

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
#### Doc
```JavaScript
/**
 * @param {object} options
 * @param {object} [options.redisClient] - redis client from redis.createClient()
 * redisClient needs to be passed in so the same connection can be used elsewhere and get closed outside this class
 */
constructor (options: ICacheConfig) {

/**
 * @param {string} name - name of the variable
 * @param {*} value - value is always JSON.stringify'ed
 * @param {number} [expiry = 0] - expire time in seconds. 0 = never expire
 * @return {promise}
 */
public set (name, value, expiry = 0) {}

/**
 * @param {string} name - name of the variable
 * @return {promise}
 */
public get (name) {}

/**
 * get the cached value, if not set, resolve "callback()" and save the value then returns it
 *
 * @param {string} name - name of the variable
 * @param {function} callback - a callback function which returns a value or a promise
 * @param {number} [expiry = 0] - expire time in seconds. 0 = never expire
 * @return {promise<{}>}
 */
public getSetIfNull (name, callback, expiry = 0) {}

/**
 * @param {string} command - redis command to run
 * @param {[]} params - params for the command
 * @return {promise}
 */
public command (command, ...params) {}
```

## captcha
recapcha wrapper
#### Example
```JavaScript
import { Captcha } from '@coolgk/utils/captcha';
// OR
// const { Captcha } = require('@coolgk/utils/captcha');

const captcha = new Captcha({
    secret: '-------'
});

const captchaResponse = '---------';

captcha.verify(captchaResponse).then((response) => {
    console.log(response); // { success: true, challenge_ts: '2017-12-03T08:19:48Z', hostname: 'www.google.com' }
                           // { success: false, 'error-codes': [ 'invalid-input-response' ] }
});
```
#### Doc
```JavaScript
/**
 * @param {object} options
 * @param {object} options.secret - google captcha secret https://www.google.com/recaptcha/admin#site/337294176
 */
constructor (options) {}

/**
 * @param {string} response - repsonse from recaptcha
 * @param {string} [remoteip] - ip address
 * @param {promise<{}>}
 */
verify (response, remoteip = '') {}
```

## csv
read and write csv files
#### Example
```JavaScript
import { Csv } from '@coolgk/utils/csv';
// OR
// const { Csv } = require('@coolgk/utils/csv');

const csv = new Csv({
    tmpConfig: { dir: '/tmp/csv' } // optional
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
    console.log(csvFilePath); // /tmp/csv/151229255018910356N9qKqUgrpzG2.csv
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
    console.log(csvFilePath); // /tmp/csv/151229255019910356AlO9kbzkdqjq.csv
    read(csvFilePath, ['col1', 'col2', 'col3']);
});

function read (file, columns) {
    // with columns/headers
    const lines = csv.readFile(file, {columns: columns});
    lines.forEach(
        (lineArray, index) => {
            console.log(lineArray, index);
            // {
                // 'column 1': 'formatted-1',
                // 'column 2': 'formatted-2',
                // 'column 3': 'formatted-3',
                // h4: 'formatted-4',
                // h5: 'formatted-5'
            // } 1
        },
        (total) => {
            console.log('read done, total:', total); // read done, total: 4
        }
    );

    // without columns/headers
    const lines2 = csv.readFile(file);
    lines2.forEach(
        (lineArray, index) => {
            console.log(lineArray, index); // [ 'formatted-1', 'formatted-2', 'formatted-3', 'formatted-4', 'formatted-5' ] 1
        },
        (total) => {
            console.log('read done, total:', total); // read done, total: 4
        }
    );
}
```
#### Doc
```JavaScript
constructor () {}

/**
 * read a csv file. the return value can ONLY be used in a forEach() loop
 * e.g. readFile('abc.csv').forEach((row, index) => { ... }, (lineCount) => { ... } )
 * @param {string} file - file path
 * @param {object} options
 * @param {string[]} [options.columns] - array of headers e.g ['id', 'name', ...] if defined, row values becomes objects
 * @param {number} [options.limit=0] - number of rows to read, 0 = unlimited
 * @param {string} [options.delimiter=','] - csv delimiter
 * @return {object} { forEach: ((row, index) => void, (totalCount) => void) => void }
 */
readFile (file, options = {}) {}

/**
 * @param {(array|cursor)} data - array of data or mongo cursor
 * @param {object} options
 * @param {string[]} [options.columns] - array of headers e.g. ['id', 'name', 'email']
 * @param {function} [options.formatter] - callback for formatting row data. It takes one row from data as parameter and should return an array e.g. (rowData) => [rowData.id, rowData.name, 'formatted data'],
 * @param {string} [options.delimiter=','] - Set the field delimiter, one character only, defaults to a comma.
 * @param {string} [options.filepath] - file path is automatically generated if empty
 * @return {promise}
 */
createFile (data, options = {}) {}

/**
 * parse a string as csv data and returns an array
 * @param {string} value - csv string
 * @param {object} options
 * @param {string[]} [options.columns] - array of headers e.g. ['id', 'name', ...] if headers is defined, the row value will be objects
 * @param {number} [options.limit=0] - number of rows to read, 0 = unlimited
 * @param {string} [options.delimiter=','] - csv delimiter
 * @return {promise}
 */
parse (value, options = {}) {}
```

## email
email sender
#### Example
```JavaScript
import { Email } from '@coolgk/utils/email';
// OR
// const { Email } = require('@coolgk/utils/email');

const email = new Email({host: 'localhost'});

email.send({
    subject: 'hello this is email subject',
    from: {
            name: 'Daniel Gong',
            email: 'daniel.k.gong@example.com'
    },
    to: [
        {
            name: 'Dan Go',
            email: 'dan@example.com'
        },
        'gong@example.com'
    ],
    message: '<html><body><h1>test</h1>some message here <img src="cid:my-image" width="500" height="250"></body></html>',
    attachments: [
        {
            path: '/tmp/test.png',
            name: 'screenshot.png'
        },
        {
            path:"/tmp/test.png",
            headers:{"Content-ID": "<my-image>"}
        }
    ]
}).then((sentMessage) => {
    console.log(sentMessage);
}).catch((error) => {
    console.log(error);
});
```
#### Doc
```JavaScript
/**
 * @param {object} options
 * @param {string} [options.user] - username for logging into smtp
 * @param {string} [options.password] - password for logging into smtp
 * @param {string} [options.host='localhost'] - smtp host
 * @param {string} [options.port] - smtp port (if null a standard port number will be used)
 * @param {boolean} [options.ssl] - boolean (if true or object, ssl connection will be made)
 * @param {boolean} [options.tls] - boolean (if true or object, starttls will be initiated)
 * @param {string} [options.domain] - domain to greet smtp with (defaults to os.hostname)
 * @param {string[]} [options.authentication] - authentication methods
 */
constructor (options = {host: 'localhost'}) {}

/**
 * @param {object} options
 * @param {string} options.subject - email subject
 * @param {string} [options.message] - html email message
 * @param {Array.<(string|object)>} options.to - to email address
 * @param {string} options.to[].name - name of the recipient
 * @param {string} options.to[].email - email address of the recipient
 * @param {(string|object)} [options.from] - see options.to
 * @param {Array.<(string|object)>} [options.cc] - see options.to
 * @param {Array.<(string|object)>} [options.bcc] - see options.to
 * @param {object[]} [attachments] - email attachments
 * @param {string} attachments.path - file path
 * @param {string} [attachments.name] - file name
 * @param {string} [attachments.type] - file mime type
 * @param {string} [attachments.method] - method to send attachment as (used by calendar invites)
 * @param {object} [attachments.headers] - attachment headers, header: value pairs, e.g. {"Content-ID":"<my-image>"}
 * @return {promise}
 */
send (options) {}
```

## number
utitlies
#### Example
```JavaScript
import { round } from '@coolgk/utils/number';
// OR
// const { round } = require('@coolgk/utils/number');

console.log(round(1.3923, 2)); // 1.39
console.log(round(100, 2)); // 100
console.log(round(100.1264, 2)); // 100.13
console.log(round(100.958747, 4)); // 100.9587
```
#### Doc
```JavaScript
/**
 * @param {number} value - number to round
 * @param {number} precision - precision
 * @return {number}
 */
function round (value, precision = 2) {}
```

## pdf
generate PDF files from html string or file
```JavaScript
import { Pdf, Format, Orientation } from '@coolgk/utils/pdf';
// OR
// const { Pdf, Format, Orientation } = require('@coolgk/utils/pdf');

const pdf = new Pdf({
    tmpConfig: { dir: '/tmp/pdf' } // optional
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
#### Doc
```JavaScript
constructor () {}

/**
 * A4 page height: 842px
 * for full page in PDF, set height of a page in html to 842px
 *
 * @param {string} htmlFilePath - file path of an html
 * @param {string} [options.pdfFilePath] - file path is automatically generated if empty
 * @param {number} [options.delay=1] - delay in seconds before generating pdf. wait for js generated contents.
 * @param {(string|number)} [options.margin=0] - e.g. 1cm or {top: '50px', left: '20px'}
 * @param {string} [options.orientation='portrait'] - e.g. portrait or landscape
 * @param {string} [options.format='A4'] - e.g. A4
 * @param {string|object} [options.header] - html code e.g. Page ${pageNumber} of ${numberOfPages}
 * @param {(string|number)} [options.header.height] - e.g. 1cm or 100px
 * @param {string} [options.header.contents] - html code e.g. Page ${pageNumber} of ${numberOfPages}
 * @param {string|object} [options.footer] - html code e.g. Page ${pageNumber} of ${numberOfPages}
 * @param {(string|number)} [options.footer.height] - e.g. 1cm or 100px
 * @param {(string|number)} [options.footer.contents] - e.g. html code e.g. Page ${pageNumber} of ${numberOfPages}
 * @param {number} [options.dpi=96] - e.g. 96
 * @return {promise}
 */
createFromHtmlFile (
    htmlFilePath: string,
    {
        pdfFilePath = '',
        delay = 0,
        margin = 0,
        orientation = Orientation.Portrait,
        format = Format.A4,
        header = '',
        footer = '',
        dpi = 96
    } = {}
) {}

/**
 * @param {string} htmlString - html code e.g. <h1>header 1</h1>
 * @see createFromHtmlFile()
 */
createFromHtmlString (htmlString, options = {}) {}
```

## queue
run async functions in order or run x number of functions in parallel per batch in order.
similar to async / await when the second parameter is 1
#### Example
```JavaScript
import { queue } from '@coolgk/utils/queue';
// OR
// const { queue } = require('@coolgk/utils/queue');

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
#### Doc
```JavaScript
/**
 * @param {function} callback - callback function that returns a promise or any other types
 * @param {number} [limit=1] - number of callback to run at the same time, by default one callback at a time
 * @return {promise}
 */
function queue (callback, limit = 1) {}
```

## string
utilities functions
#### Example
```JavaScript
import { stripTags, escapeHtml, unescapeHtml, prepad0 } from '@coolgk/utils/string';
// OR
// const { stripTags, escapeHtml, unescapeHtml, prepad0 } = require('@coolgk/utils/string');

const str = '<h1>test</h1><script>alert(1)</script>'

console.log(stripTags(str)); //  test alert(1)
console.log(escapeHtml(str)); // &lt;h1&gt;test&lt;/h1&gt;&lt;script&gt;alert(1)&lt;/script&gt;
console.log(unescapeHtml(escapeHtml(str))); // <h1>test</h1><script>alert(1)</script>

console.log(prepad0(7, 2)); // 07
console.log(prepad0(70, 3)); // 070
console.log(prepad0(70, 4)); // 0070
console.log(prepad0(1, 4)); // 0001
console.log(prepad0(1000, 2)); // 1000
```
#### Doc
```JavaScript
/**
 * strip html tags e.g. "<h1>header</h1><p>message</p>" becomes "header message"
 * @param {string} a string
 * @return {string} string with tags stripped
 */
function stripTags (value = '') {}

/**
 * escaping user input e.g. html code in a message box
 * @param {string} value - string to escape
 * @return {string}
 */
function escapeHtml (value = '') {}

/**
 * unescaping strings escaped by escapeHtml.js
 * @param {string} string - string to unescape
 * @return {string}
 */
function unescapeHtml (value = '') {}

/**
 * @param {number} value - an integer in string or number format
 * @param {number} length - length of the output e.g. length = 2, 8 becomes 08. length = 3, 70 = 070.
 * @return {string}
 */
function prepad0 (value, length = 2) {}
```

## token
an expirable, revocable token with data storage
#### Example
```JavaScript
import { Token } from '@coolgk/utils/token';
import { createClient } from 'redis';
// OR
// const { Token } = require('@coolgk/utils/token');
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
#### Doc
```JavaScript
/**
 * @param {object} options
 * @param {string} options.token - token string for creating a token object
 * @param {object} options.redisClient - from require('redis').createClient
 * @param {string} [options.prefix='token'] - prefix used in redis e.g. token:[TOKEN_STRING...]
 * @param {number} [options.expiry=0] - in seconds. 0 = never expire
 */
constructor (options) {}

/**
 * @param {number} expiry - in seconds
 * @return {promise}
 */
renew (expiry = this._expiry) {}

/**
 * set a data field value
 * @param {string} name - field name
 * @param {*} value - anything can be JSON.stringify'ed
 * @return {promise}
 */
set (name, value) {}

/**
 * @return {promise<boolean>}
 */
verify () {}

/**
 * get the value of a data field
 * @param {string} name - data field name
 * @return {promise}
 */
get (name) {}

/**
 * delete the token
 * @return {promise}
 */
destroy () {}

/**
 * delete a data field in the token
 * @param {string} name - data field name
 * @return {promise}
 */
delete (name) {}

/**
 * get the values of all data fields in the token
 * @return {promise}
 */
getAll () {}
```

## unit
unit conversion
#### Example
```JavaScript
import { bytesToString, millisecondsToString } from '@coolgk/utils/unit';
// OR
// const { bytesToString, millisecondsToString } = require('@coolgk/utils/unit');

console.log(
    bytesToString(500), // 500B
    bytesToString(5000), // 4.88KB
    bytesToString(5000000), // 4.77MB
    bytesToString(5000000000), // 4.66GB
    bytesToString(5000000000000), // 4.55TB
    bytesToString(5000000000000000), // 4547.47TB
    bytesToString(5000000000000000000) // 4547473.51TB
);

console.log('1 sec', millisecondsToString(1 * 1000)); // 1 second
console.log('1 min', millisecondsToString(60 * 1000)); // 1 minute
console.log('100 sec', millisecondsToString(100 * 1000)); // 1 minute
console.log('3 hrs', millisecondsToString(60 * 60 * 3 * 1000)); // 3 hour
console.log('1.5 days', millisecondsToString(60 * 60 * 24 * 1.5 * 1000)); // 1 day
console.log('65 days', millisecondsToString(60 * 60 * 24 * 65 * 1000)); // 2 month
console.log('365 days', millisecondsToString(60 * 60 * 24 * 365 * 1000)); // 1 year
console.log('500 days', millisecondsToString(60 * 60 * 24 * 500 * 1000)); // 1 year
console.log('900 days', millisecondsToString(60 * 60 * 24 * 900 * 1000));// 2 year
console.log('1900 days', millisecondsToString(60 * 60 * 24 * 1900 * 1000)); // 5 year
console.log('365001 days', millisecondsToString(60 * 60 * 24 * 365001 * 1000)); // 1013 year
```
#### Doc
```JavaScript
/**
 * @param {number} value - value in byte
 * @return {string} value in KB, MB, GB or TB
 */
function bytesToString (value) {}

/**
 * @param {number} value - number of milliseconds
 * @return {string} value in second, minute, hour, day, month or year
 */
function millisecondsToString (value) {}
```

## url
simple function for get parameters from url
#### Example
```JavaScript
import { getParams } from '@coolgk/utils/url';
// OR
// const { getParams } = require('@coolgk/utils/url');

const url = '/123';
const pattern = '/:id';

console.log(getParams(url, pattern)); // { id: '123' }

const url2 = '/123/abc/456';
const pattern2 = '/:id/abc/:value';

console.log(getParams(url2, pattern2)); // { id: '123', value: '456' }

const url3 = '/123/456';
const pattern3 = ':id/:value';

console.log(getParams(url3, pattern3)); // { id: '123', value: '456' }
```
#### Doc
```JavaScript
/**
 * a simple function to get params in a url e.g. with url: user/123, pattern: user/:id returns {id: 123}
 * @param {string} url - url after the domain name e.g. http://abc.com/user/:id url should be /user/:id
 * @param {string} pattern - e.g. /:userid/:name
 * @return {object} - e.g. {userid: 123}
 */
function getParams (url, pattern) {}
```

## bcrypt
bcrypt functions
#### Example
```JavaScript
import { encrypt, verify } from '@coolgk/utils/bcrypt';

const password = 'abc123';

encrypt(password).then((hash) => {
    verify(password, hash).then(console.log); // true
    verify(password, 'invalidhash').then(console.log, console.error); // Not a valid BCrypt hash.
    verify('invalidpass', hash).then(console.log); // false
});
```
#### Doc
```JavaScript
/**
 * @param {string} value - string to encrypt
 * @param {string} salt - salt
 * @return {promise<string>}
 */
function encrypt (value, salt = null) {}

/**
 * @param {string} value - string to check
 * @param {string} hashedString - encrypted hash
 * @return {promise<boolean>}
 */
function verify (value, hashedString) {}
```

## tmp
wrapper functions, generate tmp file or folders
#### Example
```JavaScript
import { generateFile, generateDir, generateTmpName } from '@coolgk/utils/tmp';
// OR
// const { generateFile, generateDir, generateTmpName } = require('@coolgk/utils/tmp');

generateFile({dir: '/tmp/test'}).then((r) => console.log('file', r)); // file { path: '/tmp/test/1512307052908140480ZZj6J0LOIJb.tmp' }

generateDir({dir: '/tmp/test'}).then((r) => console.log('dir',r)); // file { path: '/tmp/test/1512307052918140484Pnv1m95ZS2b' }

generateTmpName({dir: '/tmp/test'}).then((r) => console.log('name', r)); // name { path: '/tmp/test/151230705292114048hb3XIds0FO9Y' }
```
#### Doc
```JavaScript
/**
 * @param {object} [options]
 * @param {number} [options.mode=0600] - the file mode to create with, defaults to 0600 on file and 0700 on directory
 * @param {string} [options.prefix=Date.now()] - the optional prefix, fallbacks to tmp- if not provided
 * @param {string} [options.postfix='.tmp'] - the optional postfix, fallbacks to .tmp on file creation
 * @param {string} [options.dir=/tmp] -  the optional temporary directory, fallbacks to system default
 * @param {boolean} [options.keep] - if to keep the file
 * @return {promise}
 */
function generateFile (options) {}

/**
 * @param {object} [options]
 * @param {number} [options.mode=0600] - the file mode to create with, defaults to 0600 on file and 0700 on directory
 * @param {string} [options.prefix=Date.now()] - the optional prefix, fallbacks to tmp- if not provided
 * @param {string} [options.postfix='.tmp'] - the optional postfix, fallbacks to .tmp on file creation
 * @param {string} [options.dir=/tmp] -  the optional temporary directory, fallbacks to system default
 * @param {boolean} [options.keep] - if to keep the file
 * @return {promise}
 */
function generateDir (options) {}

/**
 * @param {object} [options]
 * @param {number} [options.mode=0600] - the file mode to create with, defaults to 0600 on file and 0700 on directory
 * @param {string} [options.prefix=Date.now()] - the optional prefix, fallbacks to tmp- if not provided
 * @param {string} [options.postfix='.tmp'] - the optional postfix, fallbacks to .tmp on file creation
 * @param {string} [options.dir=/tmp] -  the optional temporary directory, fallbacks to system default
 * @return {promise}
 */
function generateTmpName (options) {}
```

## jwt
jwt token class
#### Example
```JavaScript
import { Jwt } from '@coolgk/utils/jwt';
// OR
// const { Jwt } = require('@coolgk/utils/jwt');

const jwt = new Jwt({secret: 'abc'});

const string = 'http://example.com/a/b/c?a=1';

const token = jwt.generate(string);

console.log(
    jwt.verify(token), // { exp: 0, iat: 1512307492763, rng: 0.503008668963175, data: 'http://example.com/a/b/c?a=1' }
    jwt.verify(token+'1') // false
);

const token2 = jwt.generate(string, 200);

console.log(
    jwt.verify(token2), // { exp: 1512307493026, iat: 1512307492826, rng: 0.5832258275608753, data: 'http://example.com/a/b/c?a=1' }
    jwt.verify(token+'1') // false
);

setTimeout(() => {
    console.log(jwt.verify(token2)); // false
}, 250);
```
#### Doc
```JavaScript
/**
 * @param {object} options
 * @param {string} options.secret - for encryption
 */
public constructor (options) {}

/**
 * @param {*} data - any data can be JSON.stringify'ed
 * @param {number} [expiry=0] - in milliseconds 0 = never expire
 * @return {string}
 */
public generate (data, expiry) {}

/**
 * @param {string} token - token to verify
 * @return {boolean|object} - false or token data
 */
public verify (token) {}
```
