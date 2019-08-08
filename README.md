[![Build Status](https://travis-ci.org/coolgk/node-utils.svg?branch=master)](https://travis-ci.org/coolgk/node-utils) [![dependencies Status](https://david-dm.org/coolgk/node-utils/status.svg)](https://david-dm.org/coolgk/node-utils) [![Coverage Status](https://coveralls.io/repos/github/coolgk/node-utils/badge.svg)](https://coveralls.io/github/coolgk/node-utils) [![Known Vulnerabilities](https://snyk.io/test/github/coolgk/node-utils/badge.svg)](https://snyk.io/test/github/coolgk/node-utils)

`npm install @coolgk/utils`

You can install and use the modules below as standalone packages. If you wish to use @coolgk/utils as an all-in-one package, replace @coolgk/[module] with @coolgk/**utils**/[module] in the require() or import statements in the examples below. 

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)

Also see:

[@coolgk/mongo](https://www.npmjs.com/package/@coolgk/mongo)

A javascript / typescript MongoDB modelling library which enables joins in collections, simplifies CRUD operations for sub / nested documents and implements schema based data validation.

[@coolgk/mvc](https://www.npmjs.com/package/@coolgk/mvc)

A simple, lightweight javascript / typescript MxC framework that helps you to create object oriented, modular and testable code.

- [amqp](#coolgkamqp)
- [array](#coolgkarray)
- [bcrypt](#coolgkbcrypt)
- [base64](#coolgkbase64)
- [cache](#coolgkcache)
- [captcha](#coolgkcaptcha)
- [csv](#coolgkcsv)
- [facebook-sign-in](#coolgkfacebook-sign-in)
- [email](#coolgkemail)
- [formdata](#coolgkformdata)
- [google-sign-in](#coolgkgoogle-sign-in)
- [jwt](#coolgkjwt)
- [number](#coolgknumber)
- [pdf](#coolgkpdf)
- [queue](#coolgkqueue)
- [string](#coolgkstring)
- [session](#coolgksession)
- [tmp](#coolgktmp)
- [unit](#coolgkunit)
- [token](#coolgktoken)
- [url](#coolgkurl)

## @coolgk/amqp
a javascript / typescript module

`npm install @coolgk/amqp`

a simple RabbitMQ (amqp wrapper) class for publishing and consuming messages

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
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

```
<a name="Amqp"></a>

## Amqp
**Kind**: global class  

* [Amqp](#Amqp)
    * [new Amqp(options)](#new_Amqp_new)
    * [.closeConnection()](#Amqp+closeConnection) ⇒ <code>void</code>
    * [.publish(message, [callback], [options])](#Amqp+publish) ⇒ <code>promise.&lt;Array.&lt;boolean&gt;&gt;</code>
    * [.getChannel()](#Amqp+getChannel) ⇒ <code>promise</code>

<a name="new_Amqp_new"></a>

### new Amqp(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> |  |
| options.url | <code>string</code> | connection string e.g. amqp://localhost |
| [options.sslPem] | <code>string</code> | pem file path |
| [options.sslCa] | <code>string</code> | sslCa file path |
| [options.sslPass] | <code>string</code> | password |

<a name="Amqp+closeConnection"></a>

### amqp.closeConnection() ⇒ <code>void</code>
**Kind**: instance method of [<code>Amqp</code>](#Amqp)  
<a name="Amqp+publish"></a>

### amqp.publish(message, [callback], [options]) ⇒ <code>promise.&lt;Array.&lt;boolean&gt;&gt;</code>
**Kind**: instance method of [<code>Amqp</code>](#Amqp)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| message | <code>\*</code> |  | message any type that can be JSON.stringify'ed |
| [callback] | <code>function</code> |  | callback(message) for processing response from consumers |
| [options] | <code>object</code> |  |  |
| [options.routes] | <code>string</code> \| <code>Array.&lt;string&gt;</code> | <code>&quot;[&#x27;#&#x27;]&quot;</code> | route names |
| [options.exchangeName] | <code>string</code> | <code>&quot;&#x27;defaultExchange&#x27;&quot;</code> | exchange name |

<a name="Amqp+getChannel"></a>

### amqp.getChannel() ⇒ <code>promise</code>
**Kind**: instance method of [<code>Amqp</code>](#Amqp)  
**Returns**: <code>promise</code> - - promise<channel>  

## @coolgk/array
a javascript / typescript module

`npm install @coolgk/array`

array utilities

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { toArray } from '@coolgk/array';
// OR
// const { toArray } = require('@coolgk/array');

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

Promise.all([
    cache.set('x', 'val x'),
    cache.set('y', 'val y'),
    cache.set('z', 'val z')
]).then(
    () => Promise.all([
        cache.get('x').then(console.log), // val x
        cache.get('y').then(console.log), // val y
        cache.get('z').then(console.log) // val z
    ])
).then(
    () => Promise.all([
        cache.delete('x'),
        cache.delete('y'),
        cache.delete('z')
    ])
).then(
    () => Promise.all([
        cache.get('x').then(console.log), // null
        cache.get('y').then(console.log), // null
        cache.get('z').then(console.log) // null
    ])
);

```
<a name="toArray"></a>

## toArray(data) ⇒ <code>array</code>
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>\*</code> | any data to be type cast to array |

<a name="Cache+delete"></a>

### cache.delete(name) ⇒ <code>promise</code>
**Kind**: instance method of [<code>Cache</code>](#Cache)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> \| <code>Array.&lt;string&gt;</code> | name(s) of the variable |

<a name="Cache+getSetIfNull"></a>

### cache.getSetIfNull(name, callback, [expiry]) ⇒ <code>promise</code>
get the cached value, if not set, resolve "callback()" and save the value then return it

**Kind**: instance method of [<code>Cache</code>](#Cache)  
**Returns**: <code>promise</code> - - cached value  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | name of the variable |
| callback | <code>function</code> |  | a callback function which returns a value or a promise |
| [expiry] | <code>number</code> | <code>0</code> | expire time in seconds. 0 = never expire |

<a name="Cache+command"></a>

### cache.command(command, ...params) ⇒ <code>promise</code>
**Kind**: instance method of [<code>Cache</code>](#Cache)  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>string</code> | redis command to run |
| ...params | <code>array</code> | params for the command |


## @coolgk/bcrypt
a javascript / typescript module

`npm install @coolgk/bcrypt`

just a promise wrapper

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { encrypt, verify } from '@coolgk/bcrypt';
// OR
// const { encrypt, verify } = require('@coolgk/bcrypt');

const password = 'abc123';

encrypt(password).then((hash) => {
    verify(password, hash).then(console.log); // true
    verify(password, 'invalidhash').then(console.log, console.error); // Not a valid BCrypt hash.
    verify('invalidpass', hash).then(console.log); // false
});

```
## Functions

<dl>
<dt><a href="#encrypt">encrypt(value, salt)</a> ⇒ <code>promise.&lt;string&gt;</code></dt>
<dd></dd>
<dt><a href="#verify">verify(value, hashedString)</a> ⇒ <code>promise.&lt;boolean&gt;</code></dt>
<dd></dd>
</dl>

<a name="encrypt"></a>

## encrypt(value, salt) ⇒ <code>promise.&lt;string&gt;</code>
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>string</code> | string to encrypt |
| salt | <code>string</code> | salt |

<a name="verify"></a>

## verify(value, hashedString) ⇒ <code>promise.&lt;boolean&gt;</code>
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>string</code> | string to check |
| hashedString | <code>string</code> | encrypted hash |


## @coolgk/cache
a javascript / typescript module

`npm install @coolgk/cache`

a redis wrapper

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { Cache } from '@coolgk/cache';
import { createClient } from 'redis';
// OR
// const { Cache } = require('@coolgk/cache');
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

Promise.all([
    cache.set('x', 'val x'),
    cache.set('y', 'val y'),
    cache.set('z', 'val z')
]).then(
    () => Promise.all([
        cache.get('x').then(console.log), // val x
        cache.get('y').then(console.log), // val y
        cache.get('z').then(console.log) // val z
    ])
).then(
    () => Promise.all([
        cache.delete('x'),
        cache.delete('y'),
        cache.delete('z')
    ])
).then(
    () => Promise.all([
        cache.get('x').then(console.log), // null
        cache.get('y').then(console.log), // null
        cache.get('z').then(console.log) // null
    ])
);

```
<a name="Cache"></a>

## Cache
**Kind**: global class  

* [Cache](#Cache)
    * [new Cache(options)](#new_Cache_new)
    * [.set(name, value, [expiry])](#Cache+set) ⇒ <code>promise</code>
    * [.get(name)](#Cache+get) ⇒ <code>promise</code>
    * [.delete(name)](#Cache+delete) ⇒ <code>promise</code>
    * [.getSetIfNull(name, callback, [expiry])](#Cache+getSetIfNull) ⇒ <code>promise</code>
    * [.command(command, ...params)](#Cache+command) ⇒ <code>promise</code>

<a name="new_Cache_new"></a>

### new Cache(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> |  |
| [options.redisClient] | <code>object</code> | redis client from redis.createClient() redisClient needs to be passed in so the same connection can be used elsewhere and get closed outside this class |

<a name="Cache+set"></a>

### cache.set(name, value, [expiry]) ⇒ <code>promise</code>
**Kind**: instance method of [<code>Cache</code>](#Cache)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | name of the variable |
| value | <code>\*</code> |  | value is always JSON.stringify'ed |
| [expiry] | <code>number</code> | <code>0</code> | expire time in seconds. 0 = never expire |

<a name="Cache+get"></a>

### cache.get(name) ⇒ <code>promise</code>
**Kind**: instance method of [<code>Cache</code>](#Cache)  
**Returns**: <code>promise</code> - - cached value  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of the variable |

<a name="Cache+delete"></a>

### cache.delete(name) ⇒ <code>promise</code>
**Kind**: instance method of [<code>Cache</code>](#Cache)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> \| <code>Array.&lt;string&gt;</code> | name(s) of the variable |

<a name="Cache+getSetIfNull"></a>

### cache.getSetIfNull(name, callback, [expiry]) ⇒ <code>promise</code>
get the cached value, if not set, resolve "callback()" and save the value then return it

**Kind**: instance method of [<code>Cache</code>](#Cache)  
**Returns**: <code>promise</code> - - cached value  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | name of the variable |
| callback | <code>function</code> |  | a callback function which returns a value or a promise |
| [expiry] | <code>number</code> | <code>0</code> | expire time in seconds. 0 = never expire |

<a name="Cache+command"></a>

### cache.command(command, ...params) ⇒ <code>promise</code>
**Kind**: instance method of [<code>Cache</code>](#Cache)  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>string</code> | redis command to run |
| ...params | <code>array</code> | params for the command |


## @coolgk/captcha
a javascript / typescript module

`npm install @coolgk/captcha`

recapcha wrapper

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
const { verify } = require('@coolgk/captcha');
const secret = '-------';

verify(secret, captchaResponse).then((response) => {
    console.log(response); // { success: true, challenge_ts: '2017-12-03T08:19:48Z', hostname: 'www.google.com' }
                           // { success: false, 'error-codes': [ 'invalid-input-response' ] }
});

// OR

import { Captcha } from '@coolgk/captcha';
// OR
// const { Captcha } = require('@coolgk/captcha');

const captcha = new Captcha({ secret });

const captchaResponse = '---------';

captcha.verify(captchaResponse).then((response) => {
    console.log(response); // { success: true, challenge_ts: '2017-12-03T08:19:48Z', hostname: 'www.google.com' }
                           // { success: false, 'error-codes': [ 'invalid-input-response' ] }
});

```
<a name="Captcha"></a>

## Captcha
**Kind**: global class  

* [Captcha](#Captcha)
    * [new Captcha(options)](#new_Captcha_new)
    * [.verify(response, [remoteip])](#Captcha+verify)

<a name="new_Captcha_new"></a>

### new Captcha(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> |  |
| options.secret | <code>object</code> | google captcha secret https://www.google.com/recaptcha/admin#site/337294176 |

<a name="Captcha+verify"></a>

### captcha.verify(response, [remoteip])
**Kind**: instance method of [<code>Captcha</code>](#Captcha)  

| Param | Type | Description |
| --- | --- | --- |
| response | <code>string</code> | repsonse from recaptcha |
| [remoteip] | <code>string</code> | ip address |
|  | <code>promise</code> |  |


## @coolgk/email
a javascript / typescript module

`npm install @coolgk/email`

a email sender wrapper class

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { Email } from '@coolgk/email';
// OR
// const { Email } = require('@coolgk/email');

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
<a name="Email"></a>

## Email
**Kind**: global class  
**See**: https://www.npmjs.com/package/emailjs#emailserverconnectoptions  

* [Email](#Email)
    * [new Email(options)](#new_Email_new)
    * [.send(options, [attachments])](#Email+send) ⇒ <code>promise</code>

<a name="new_Email_new"></a>

### new Email(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  |  |
| [options.user] | <code>string</code> |  | username for logging into smtp |
| [options.password] | <code>string</code> |  | password for logging into smtp |
| [options.host] | <code>string</code> | <code>&quot;&#x27;localhost&#x27;&quot;</code> | smtp host |
| [options.port] | <code>string</code> |  | smtp port (if null a standard port number will be used) |
| [options.ssl] | <code>boolean</code> |  | boolean (if true or object, ssl connection will be made) |
| [options.tls] | <code>boolean</code> |  | boolean (if true or object, starttls will be initiated) |
| [options.domain] | <code>string</code> |  | domain to greet smtp with (defaults to os.hostname) |
| [options.authentication] | <code>Array.&lt;string&gt;</code> |  | authentication methods |

<a name="Email+send"></a>

### email.send(options, [attachments]) ⇒ <code>promise</code>
**Kind**: instance method of [<code>Email</code>](#Email)  
**Returns**: <code>promise</code> - - message sent  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> |  |
| options.subject | <code>string</code> | email subject |
| [options.message] | <code>string</code> | html email message |
| options.to | <code>Array.&lt;(string\|object)&gt;</code> | to email address |
| options.to[].name | <code>string</code> | name of the recipient |
| options.to[].email | <code>string</code> | email address of the recipient |
| [options.from] | <code>string</code> \| <code>object</code> | see options.to |
| [options.cc] | <code>Array.&lt;(string\|object)&gt;</code> | see options.to |
| [options.bcc] | <code>Array.&lt;(string\|object)&gt;</code> | see options.to |
| [attachments] | <code>Array.&lt;object&gt;</code> | email attachments |
| attachments.path | <code>string</code> | file path |
| [attachments.name] | <code>string</code> | file name |
| [attachments.type] | <code>string</code> | file mime type |
| [attachments.method] | <code>string</code> | method to send attachment as (used by calendar invites) |
| [attachments.headers] | <code>object</code> | attachment headers, header: value pairs, e.g. {"Content-ID":"<my-image>"} |


## @coolgk/facebook-sign-in
a javascript / typescript module

`npm install @coolgk/facebook-sign-in`

facebook sign in module which verifies client access token and returns account data

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
const { FacebookSignIn } = require('@coolgk/facebook-sign-in');
// OR
// import { FacebookSignIn } from '@coolgk/facebook-sign-in';

const facebookSignIn = new FacebookSignIn({
    clientId: '...',
    secret: '...'
});

const invalidToken = '...';
const validToken = '...';

(async () => {
    const account1 = await facebookSignIn.verify(invalidToken);
    console.log(account1); // false

    const account2 = await facebookSignIn.verify(validToken);
    console.log(account2); // { email: 'abc@example.com', id: '123123123123123123' }
})()

```
<a name="FacebookSignIn"></a>

## FacebookSignIn
**Kind**: global class  
**Export**:   

* [FacebookSignIn](#FacebookSignIn)
    * _instance_
        * [.verify(token, [fields])](#FacebookSignIn+verify) ⇒ <code>Promise.&lt;(false\|object)&gt;</code>
    * _static_
        * [.FacebookSignIn](#FacebookSignIn.FacebookSignIn)
            * [new FacebookSignIn(options)](#new_FacebookSignIn.FacebookSignIn_new)

<a name="FacebookSignIn+verify"></a>

### facebookSignIn.verify(token, [fields]) ⇒ <code>Promise.&lt;(false\|object)&gt;</code>
verify access token from clients and return false or account data

**Kind**: instance method of [<code>FacebookSignIn</code>](#FacebookSignIn)  
**Returns**: <code>Promise.&lt;(false\|object)&gt;</code> - - false if access token is invalid otherwise returns account data  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| token | <code>string</code> |  | facebook user's token string |
| [fields] | <code>string</code> | <code>&quot;&#x27;email&#x27;&quot;</code> | fields to fetch from user's facebook account. comma separated value e.g. id,name,email |

<a name="FacebookSignIn.FacebookSignIn"></a>

### FacebookSignIn.FacebookSignIn
**Kind**: static class of [<code>FacebookSignIn</code>](#FacebookSignIn)  
<a name="new_FacebookSignIn.FacebookSignIn_new"></a>

#### new FacebookSignIn(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> |  |
| options.clientId | <code>string</code> | facebook app id |
| options.secret | <code>string</code> | facebook app secret |


## @coolgk/csv
a javascript / typescript module

`npm install @coolgk/csv`

read and write csv files

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { Csv } from '@coolgk/csv';
// OR
// const { Csv } = require('@coolgk/csv');

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
        formatter: (row) => {
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
        formatter: (row) => {
            return [row.col1 + '+format', row.col2 + '+format', row.col3 + '+format'];
        }
    }
).then((csvFilePath) => {
    console.log(csvFilePath); // /tmp/csv/151229255019910356AlO9kbzkdqjq.csv
    read(csvFilePath, ['col1', 'col2', 'col3']);
});

function read (file, columns) {
    // with columns/headers
    // read lines as object
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
    // read lines as array
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

## @coolgk/facebook-sign-in
a javascript / typescript module

`npm install @coolgk/facebook-sign-in`

facebook sign in module which verifies client access token and returns account data

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
const { FacebookSignIn } = require('@coolgk/facebook-sign-in');
// OR
// import { FacebookSignIn } from '@coolgk/facebook-sign-in';

const facebookSignIn = new FacebookSignIn({
    clientId: '...',
    secret: '...'
});

const invalidToken = '...';
const validToken = '...';

(async () => {
    const account1 = await facebookSignIn.verify(invalidToken);
    console.log(account1); // false

    const account2 = await facebookSignIn.verify(validToken);
    console.log(account2); // { email: 'abc@example.com', id: '123123123123123123' }
})()

```
<a name="FacebookSignIn"></a>

## FacebookSignIn
**Kind**: global class  

* [FacebookSignIn](#FacebookSignIn)
    * _instance_
        * [.verify(token, [fields])](#FacebookSignIn+verify) ⇒ <code>Promise.&lt;(false\|object)&gt;</code>
    * _static_
        * [.FacebookSignIn](#FacebookSignIn.FacebookSignIn)
            * [new FacebookSignIn(options)](#new_FacebookSignIn.FacebookSignIn_new)

<a name="FacebookSignIn+verify"></a>

### facebookSignIn.verify(token, [fields]) ⇒ <code>Promise.&lt;(false\|object)&gt;</code>
verify access token from clients and return false or account data

**Kind**: instance method of [<code>FacebookSignIn</code>](#FacebookSignIn)  
**Returns**: <code>Promise.&lt;(false\|object)&gt;</code> - - false if access token is invalid otherwise returns account data  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| token | <code>string</code> |  | facebook user's token string |
| [fields] | <code>string</code> | <code>&quot;&#x27;email&#x27;&quot;</code> | fields to fetch from user's facebook account. comma separated value e.g. id,name,email |

<a name="FacebookSignIn.FacebookSignIn"></a>

### FacebookSignIn.FacebookSignIn
**Kind**: static class of [<code>FacebookSignIn</code>](#FacebookSignIn)  
<a name="new_FacebookSignIn.FacebookSignIn_new"></a>

#### new FacebookSignIn(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> |  |
| options.clientId | <code>string</code> | facebook app id |
| options.secret | <code>string</code> | facebook app secret |


## @coolgk/email
a javascript / typescript module

`npm install @coolgk/email`

a email sender wrapper class

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { Email } from '@coolgk/email';
// OR
// const { Email } = require('@coolgk/email');

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
<a name="Email"></a>

## Email
**Kind**: global class  
**See**: https://www.npmjs.com/package/emailjs#emailserverconnectoptions  

* [Email](#Email)
    * [new Email(options)](#new_Email_new)
    * [.send(options, [attachments])](#Email+send) ⇒ <code>promise</code>

<a name="new_Email_new"></a>

### new Email(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  |  |
| [options.user] | <code>string</code> |  | username for logging into smtp |
| [options.password] | <code>string</code> |  | password for logging into smtp |
| [options.host] | <code>string</code> | <code>&quot;&#x27;localhost&#x27;&quot;</code> | smtp host |
| [options.port] | <code>string</code> |  | smtp port (if null a standard port number will be used) |
| [options.ssl] | <code>boolean</code> |  | boolean (if true or object, ssl connection will be made) |
| [options.tls] | <code>boolean</code> |  | boolean (if true or object, starttls will be initiated) |
| [options.domain] | <code>string</code> |  | domain to greet smtp with (defaults to os.hostname) |
| [options.authentication] | <code>Array.&lt;string&gt;</code> |  | authentication methods |

<a name="Email+send"></a>

### email.send(options, [attachments]) ⇒ <code>promise</code>
**Kind**: instance method of [<code>Email</code>](#Email)  
**Returns**: <code>promise</code> - - message sent  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> |  |
| options.subject | <code>string</code> | email subject |
| [options.message] | <code>string</code> | html email message |
| options.to | <code>Array.&lt;(string\|object)&gt;</code> | to email address |
| options.to[].name | <code>string</code> | name of the recipient |
| options.to[].email | <code>string</code> | email address of the recipient |
| [options.from] | <code>string</code> \| <code>object</code> | see options.to |
| [options.cc] | <code>Array.&lt;(string\|object)&gt;</code> | see options.to |
| [options.bcc] | <code>Array.&lt;(string\|object)&gt;</code> | see options.to |
| [attachments] | <code>Array.&lt;object&gt;</code> | email attachments |
| attachments.path | <code>string</code> | file path |
| [attachments.name] | <code>string</code> | file name |
| [attachments.type] | <code>string</code> | file mime type |
| [attachments.method] | <code>string</code> | method to send attachment as (used by calendar invites) |
| [attachments.headers] | <code>object</code> | attachment headers, header: value pairs, e.g. {"Content-ID":"<my-image>"} |


## @coolgk/formdata
a javascript / typescript module

`npm install @coolgk/formdata`

A http request form data parser (large file friendly) for 'application/json', 'application/x-www-form-urlencoded' and 'multipart/form-data'. It only parses form data when you ask for it.

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
#### Example Form
```html
<form method="POST" enctype="multipart/form-data">
    <input type="text" name="name">
    <input type="text" name="age">
    <input type="file" name="photo">
    <input type="file" name="photo">
    <input type="file" name="id">
</form>
```
#### Express Middleware
```javascript
// express middleware
const app = require('express')();
const formdata = require('@coolgk/formdata');

app.use(formdata.express());

app.post('/id-only', async (request, response, next) => {
    const post = await request.formdata.getData('id'); // upload 3 files but only parse 1, ignore others
    console.log(post);
    response.json(post);
    // output
    // {
        // "name": "Tim",
        // "age": "33",
        // "id": {
            // "error": null,
            // "fieldname": "id",
            // "filename": "test.txt",
            // "encoding": "7bit",
            // "mimetype": "text/plain",
            // "size": 13,
            // "path": "/tmp/151605931497716067xZGgxPUdNvoj"
        // }
    // }
});

app.post('/all-files', async (request, response, next) => {
    const post = await request.formdata.getData(['id', 'photo']); // parse all files
    console.log(post);
    response.json(post);
    // output
    // {
        // "name": "Tim",
        // "age": "33",
        // "photo": [
            // {
                // "error": null,
                // "fieldname": "photo",
                // "filename": "test.png",
                // "encoding": "7bit",
                // "mimetype": "image/png",
                // "size": 604,
                // "path": "/tmp/151605931497716067xZGgxPUdNvoj"
            // },
            // {
                // "error": null,
                // "fieldname": "photo",
                // "filename": "test.svg",
                // "encoding": "7bit",
                // "mimetype": "image/svg+xml",
                // "size": 2484,
                // "path": "/tmp/151605931497916067EAUAa3yB4q42"
            // }
        // ],
        // "id": {
            // "error": null,
            // "fieldname": "id",
            // "filename": "test.txt",
            // "encoding": "7bit",
            // "mimetype": "text/plain",
            // "size": 13,
            // "path": "/tmp/151605931498016067zqZe6dlhidQ5"
        // }
    // }
});

app.listen(8888);
```
#### Native Node App
```javascript
const { formData, express, getFormData, FormDataError } = require('@coolgk/formdata');
const http = require('http');
http.createServer(async (request, response) => {

    const data = await getFormData(request, { fileFieldNames: ['id', 'photo'] });

    // OR
    // const formdata = formData(request);
    // ... some middelware
    // ... in some routes
    // const data = formdata.getData(['id', 'photo']);

    console.log(data);
    response.end(JSON.stringify(data));

    // {
        // "name": "Tim",
        // "age": "33",
        // "photo": [
            // {
                // "error": null,
                // "fieldname": "photo",
                // "filename": "test.png",
                // "encoding": "7bit",
                // "mimetype": "image/png",
                // "size": 604,
                // "path": "/tmp/151605931497716067xZGgxPUdNvoj"
            // },
            // {
                // "error": null,
                // "fieldname": "photo",
                // "filename": "test.svg",
                // "encoding": "7bit",
                // "mimetype": "image/svg+xml",
                // "size": 2484,
                // "path": "/tmp/151605931497916067EAUAa3yB4q42"
            // }
        // ],
        // "id": {
            // "error": null,
            // "fieldname": "id",
            // "filename": "test.txt",
            // "encoding": "7bit",
            // "mimetype": "text/plain",
            // "size": 13,
            // "path": "/tmp/151605931498016067zqZe6dlhidQ5"
        // }
    // }

}).listen(8888);
```

## @coolgk/google-sign-in
a javascript / typescript module

`npm install @coolgk/google-sign-in`

google sign in module which verifies id token and returns account data

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
const { GoogleSignIn } = require('@coolgk/google-sign-in');
// OR
// import { GoogleSignIn } from '@coolgk/google-sign-in';

const googleSignIn = new GoogleSignIn({
    clientId: '......'
});

const invalidToken = '...';
const validToken = '...';

(async () => {
    const account1 = await googleSignIn.verify(invalidToken);
    console.log(account1); // false

    const account2 = await googleSignIn.verify(validToken);
    console.log(account2);
    // {
    //     azp: '...',
    //     aud: '...',
    //     sub: '123123123',
    //     email: 'abc@exmaple.com',
    //     email_verified: true,
    //     at_hash: 'asdfasdfasdfasdfa',
    //     exp: 1520633389,
    //     iss: 'accounts.google.com',
    //     jti: 'qfwfasdfasdfasdfasdfasdfasdfadsf',
    //     iat: 1520629789,
    //     name: 'first last',
    //     picture: 'https://lh6.googleusercontent.com/.../photo.jpg',
    //     given_name: 'first',
    //     family_name: 'last',
    //     locale: 'en-GB'
    // }
})()

```
<a name="GoogleSignIn"></a>

## GoogleSignIn
**Kind**: global class  

* [GoogleSignIn](#GoogleSignIn)
    * _instance_
        * [.verify(token)](#GoogleSignIn+verify) ⇒ <code>Promise.&lt;(boolean\|object)&gt;</code>
    * _static_
        * [.GoogleSignIn](#GoogleSignIn.GoogleSignIn)
            * [new GoogleSignIn(options)](#new_GoogleSignIn.GoogleSignIn_new)

<a name="GoogleSignIn+verify"></a>

### googleSignIn.verify(token) ⇒ <code>Promise.&lt;(boolean\|object)&gt;</code>
**Kind**: instance method of [<code>GoogleSignIn</code>](#GoogleSignIn)  
**Returns**: <code>Promise.&lt;(boolean\|object)&gt;</code> - - false if id token is invalid otherwise returns account data  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>string</code> | google id token string |

<a name="GoogleSignIn.GoogleSignIn"></a>

### GoogleSignIn.GoogleSignIn
**Kind**: static class of [<code>GoogleSignIn</code>](#GoogleSignIn)  
<a name="new_GoogleSignIn.GoogleSignIn_new"></a>

#### new GoogleSignIn(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> |  |
| options.clientId | <code>string</code> | google client id |


## @coolgk/jwt
a javascript / typescript module

`npm install @coolgk/jwt`

a simple jwt token class

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { Jwt } from '@coolgk/jwt';
// OR
// const { Jwt } = require('@coolgk/jwt');

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
<a name="Jwt"></a>

## Jwt
**Kind**: global class  

* [Jwt](#Jwt)
    * [new Jwt(options)](#new_Jwt_new)
    * [.generate(data, [expiry])](#Jwt+generate) ⇒ <code>string</code>
    * [.verify(token)](#Jwt+verify) ⇒ <code>boolean</code> \| <code>object</code>

<a name="new_Jwt_new"></a>

### new Jwt(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> |  |
| options.secret | <code>string</code> | for encryption |

<a name="Jwt+generate"></a>

### jwt.generate(data, [expiry]) ⇒ <code>string</code>
**Kind**: instance method of [<code>Jwt</code>](#Jwt)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>\*</code> |  | any data can be JSON.stringify'ed |
| [expiry] | <code>number</code> | <code>0</code> | in milliseconds 0 = never expire |

<a name="Jwt+verify"></a>

### jwt.verify(token) ⇒ <code>boolean</code> \| <code>object</code>
**Kind**: instance method of [<code>Jwt</code>](#Jwt)  
**Returns**: <code>boolean</code> \| <code>object</code> - - false or the payload of the token  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>string</code> | token to verify |


## @coolgk/number
a javascript / typescript module

`npm install @coolgk/number`

number utitlies

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { round } from '@coolgk/number';
// OR
// const { round } = require('@coolgk/number');

console.log(round(1.3923, 2)); // 1.39
console.log(round(100, 2)); // 100
console.log(round(100.1264, 2)); // 100.13
console.log(round(100.958747, 4)); // 100.9587

```
<a name="round"></a>

## round(value, precision) ⇒ <code>number</code>
**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| value | <code>number</code> |  | number to round |
| precision | <code>number</code> | <code>2</code> | precision |


## @coolgk/pdf
a javascript / typescript module

`npm install @coolgk/pdf`

html to PDF module. create PDF files from html string or file.

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
// for "error while loading shared libraries: libfontconfig.so" run "sudo apt-get -y install libfontconfig"

import { Pdf, Format, Orientation } from '@coolgk/pdf';
// OR
// const { Pdf, Format, Orientation } = require('@coolgk/pdf');

const pdf = new Pdf({
    tmpConfig: { dir: '/tmp/pdf' } // optional
});

pdf.createFromHtmlFile(
    '/tmp/test.html',
    {
        header: {
            height: '1cm',
            contents: "<strong style='color: red'>Page ${pageNumber} of ${numberOfPages} - ${pageNumber}</strong>"
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

## @coolgk/session
a javascript / typescript module

`npm install @coolgk/session`

An session handler that works without cookie (and with cookie too).

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)

When working without cookie, this class reads the session token from the **"Authorization"** header.
e.g. **Authorization : Bearer cn389ncoiwuencr...**
#### Express Middleware Example
```javascript
// express middleware
const session = require('@coolgk/session');
const app = require('express')();

app.use(
    session.express({
        redisClient: require('redis').createClient({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD
        }),
        secret: '123' // secret is required for creating the session token / id
    })
);

app.use(async (request, response, next) => {
    // allow access if it's the login page or the request has a valid session
    if ('/login' === request.url || await request.session.verifyAndRenew()) { // if session is verified, renew session
        next();
    } else { // deny access
        response.send('Please Login');
        // output
        // 'Please Login'
    }
});

app.get('/login', async (request, response, next) => {
    // start a new session (create a new session id)
    const accessToken = await request.session.init();
    // set session variables
    await request.session.set('user', { id: 1, username: 'abc' });
    // send session token/id back
    response.json({ accessToken });
    // output
    // {"accessToken":"eyJleHAiOjAsIml..."}
});

app.get('/user', async (request, response, next) => {
    // get session variable
    response.json(await request.session.get('user'));
    // output
    // {"id":1,"username":"abc"}
});

app.get('/session', async (request, response, next) => {
    // get all session values
    response.json(await request.session.getAll());
    // output
    // {"user":{"id":1,"username":"abc"}}
});

app.get('/logout', async (request, response, next) => {
    // destroy current session
    await request.session.destroy();
    response.json(await request.session.getAll());
    // output
    // {}
});

app.listen(8888);
```
#### Native Node App Example
```javascript
import { Session } from '@coolgk/session';
// OR
// const { Session } = require('@coolgk/session');

const http = require('http');
http.createServer(async (request, response) => {

    const session = new Session({
        redisClient: require('redis').createClient({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD
        }),
        secret: '123',
        request,
        response
    });

## @coolgk/string
a javascript / typescript module

`npm install @coolgk/string`

string utility functions

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { stripTags, escapeHtml, unescapeHtml, prepad0 } from '@coolgk/string';
// OR
// const { stripTags, escapeHtml, unescapeHtml, prepad0 } = require('@coolgk/string');

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
## Functions

<dl>
<dt><a href="#stripTags">stripTags(a)</a> ⇒ <code>string</code></dt>
<dd><p>strip html tags e.g. &quot;&lt;h1&gt;header&lt;/h1&gt;&lt;p&gt;message&lt;/p&gt;&quot; becomes &quot;header message&quot;</p>
</dd>
<dt><a href="#escapeHtml">escapeHtml(value)</a> ⇒ <code>string</code></dt>
<dd><p>escaping user input e.g. html code in a message box</p>
</dd>
<dt><a href="#unescapeHtml">unescapeHtml(string)</a> ⇒ <code>string</code></dt>
<dd><p>unescaping strings escaped by escapeHtml()</p>
</dd>
<dt><a href="#prepad0">prepad0(value, length)</a> ⇒ <code>string</code></dt>
<dd><p>use padStart instead</p>
</dd>
</dl>

<a name="stripTags"></a>

## stripTags(a) ⇒ <code>string</code>
strip html tags e.g. "&lt;h1&gt;header&lt;/h1&gt;&lt;p&gt;message&lt;/p&gt;" becomes "header message"

**Kind**: global function  
**Returns**: <code>string</code> - - string with tags stripped  

| Param | Type | Description |
| --- | --- | --- |
| a | <code>string</code> | string |

<a name="escapeHtml"></a>

## escapeHtml(value) ⇒ <code>string</code>
escaping user input e.g. html code in a message box

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>string</code> | string to escape |

<a name="unescapeHtml"></a>

## unescapeHtml(string) ⇒ <code>string</code>
unescaping strings escaped by escapeHtml()

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| string | <code>string</code> | string to unescape |

<a name="prepad0"></a>

## prepad0(value, length) ⇒ <code>string</code>
use padStart instead

**Kind**: global function  
**See**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| value | <code>number</code> |  | an integer in string or number format |
| length | <code>number</code> | <code>2</code> | length of the output e.g. length = 2, 8 becomes 08. length = 3, 70 = 070. |


## @coolgk/session
a javascript / typescript module

`npm install @coolgk/session`

An session handler that works without cookie (and with cookie too).

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)

When working without cookie, this class reads the session token from the **"Authorization"** header.
e.g. **Authorization : Bearer cn389ncoiwuencr...**
#### Express Middleware Example
```javascript
// express middleware
const session = require('@coolgk/session');
const app = require('express')();

app.use(
    session.express({
        redisClient: require('redis').createClient({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD
        }),
        secret: '123' // secret is required for creating the session token / id
    })
);

app.use(async (request, response, next) => {
    // allow access if it's the login page or the request has a valid session
    if ('/login' === request.url || await request.session.verifyAndRenew()) { // if session is verified, renew session
        next();
    } else { // deny access
        response.send('Please Login');
        // output
        // 'Please Login'
    }
});

app.get('/login', async (request, response, next) => {
    // start a new session (create a new session id)
    const accessToken = await request.session.init();
    // set session variables
    await request.session.set('user', { id: 1, username: 'abc' });
    // send session token/id back
    response.json({ accessToken });
    // output
    // {"accessToken":"eyJleHAiOjAsIml..."}
});

app.get('/user', async (request, response, next) => {
    // get session variable
    response.json(await request.session.get('user'));
    // output
    // {"id":1,"username":"abc"}
});

app.get('/session', async (request, response, next) => {
    // get all session values
    response.json(await request.session.getAll());
    // output
    // {"user":{"id":1,"username":"abc"}}
});

app.get('/logout', async (request, response, next) => {
    // destroy current session
    await request.session.destroy();
    response.json(await request.session.getAll());
    // output
    // {}
});

app.listen(8888);
```
#### Native Node App Example
```javascript
import { Session } from '@coolgk/session';
// OR
// const { Session } = require('@coolgk/session');

const http = require('http');
http.createServer(async (request, response) => {

    const session = new Session({
        redisClient: require('redis').createClient({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD
        }),
        secret: '123',
        request,
        response
    });

    // ... some middelware
    // ... in some routes
    // set sesstion
    await session.start();
    await session.set('user', {id: 1, username: 'user@example.com'});

    // check session and renew if verified
    const verified = await session.verifyAndRenew();
    if (verified) {
        // session exists, logged in, do something
    } else {
        // deny access or show login screen
    }

    // show session data
    response.end(
        JSON.stringify(
            await session.getAll()
        )
    ); // {"user":{"id":1,"username":"user@example.com"}}

}).listen(8888);
```
#### To use without cookie
Create a session without the **"response"** property and the sessoin object will read the session id from the **"Authorization"** header i.e. **Authorization : Bearer cn389ncoiwuencr...**
```javascript
const session = new Session({
    redisClient: require('redis').createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
    }),
    secret: '123',
    request
});
```
<a name="Session"></a>

## Session
This class extends @coolgk/token see set(), get(), delete(), getAll() in @coolgk/token

**Kind**: global class  

* [Session](#Session)
    * [.destroy()](#Session+destroy) ⇒ <code>promise</code>
    * [.renew([expiry])](#Session+renew) ⇒ <code>promise</code>

<a name="Session+destroy"></a>

### session.destroy() ⇒ <code>promise</code>
destory the current session

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+renew"></a>

### session.renew([expiry]) ⇒ <code>promise</code>
renew session optionally with a different expiry time

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>promise</code> - - false if session has not been started or has a invalid token string  

| Param | Type | Description |
| --- | --- | --- |
| [expiry] | <code>number</code> | in seconds |


## @coolgk/bcrypt
a javascript / typescript module

`npm install @coolgk/bcrypt`

just a promise wrapper

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { encrypt, verify } from '@coolgk/bcrypt';
// OR
// const { encrypt, verify } = require('@coolgk/bcrypt');

const password = 'abc123';

encrypt(password).then((hash) => {
    verify(password, hash).then(console.log); // true
    verify(password, 'invalidhash').then(console.log, console.error); // Not a valid BCrypt hash.
    verify('invalidpass', hash).then(console.log); // false
});

```
## Functions

<dl>
<dt><a href="#encrypt">encrypt(value, salt)</a> ⇒ <code>promise.&lt;string&gt;</code></dt>
<dd></dd>
<dt><a href="#verify">verify(value, hashedString)</a> ⇒ <code>promise.&lt;boolean&gt;</code></dt>
<dd></dd>
</dl>

<a name="encrypt"></a>

## encrypt(value, salt) ⇒ <code>promise.&lt;string&gt;</code>
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>string</code> | string to encrypt |
| salt | <code>string</code> | salt |

<a name="verify"></a>

## verify(value, hashedString) ⇒ <code>promise.&lt;boolean&gt;</code>
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>string</code> | string to check |
| hashedString | <code>string</code> | encrypted hash |


## @coolgk/tmp
a javascript / typescript module

`npm install @coolgk/tmp`

wrapper functions, generate tmp file or folders

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { generateFile, generateDir, generateTmpName } from '@coolgk/tmp';
// OR
// const { generateFile, generateDir, generateTmpName } = require('@coolgk/tmp');

generateFile({dir: '/tmp/test'}).then((r) => console.log('file', r));
    // file { path: '/tmp/test/1512307052908140480ZZj6J0LOIJb.tmp' }

generateDir({dir: '/tmp/test'}).then((r) => console.log('dir',r));
    // dir { path: '/tmp/test/1512307052918140484Pnv1m95ZS2b' }

generateTmpName({dir: '/tmp/test'}).then((r) => console.log('name', r));
    // name { path: '/tmp/test/151230705292114048hb3XIds0FO9Y' }

```
## Functions

<dl>
<dt><a href="#generateFile">generateFile([options])</a> ⇒ <code>promise</code></dt>
<dd></dd>
<dt><a href="#generateDir">generateDir([options])</a> ⇒ <code>promise</code></dt>
<dd></dd>
<dt><a href="#generateTmpName">generateTmpName([options])</a> ⇒ <code>promise</code></dt>
<dd></dd>
</dl>

<a name="generateFile"></a>

## generateFile([options]) ⇒ <code>promise</code>
**Kind**: global function  
**Returns**: <code>promise</code> - - { path: ..., cleanupCallback: ... } calling cleanupCallback() removes the generated file  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  |  |
| [options.mode] | <code>number</code> | <code>0600</code> | the file mode to create with, defaults to 0600 on file and 0700 on directory |
| [options.prefix] | <code>string</code> | <code>&quot;Date.now()&quot;</code> | the optional prefix, fallbacks to tmp- if not provided |
| [options.postfix] | <code>string</code> | <code>&quot;&#x27;.tmp&#x27;&quot;</code> | the optional postfix, fallbacks to .tmp on file creation |
| [options.dir] | <code>string</code> | <code>&quot;/tmp&quot;</code> | the optional temporary directory, fallbacks to system default |
| [options.keep] | <code>boolean</code> | <code>false</code> | if to keep the file |

<a name="generateDir"></a>

## generateDir([options]) ⇒ <code>promise</code>
**Kind**: global function  
**Returns**: <code>promise</code> - - { path: ..., cleanupCallback: ... } calling cleanupCallback() removes the generated file  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  |  |
| [options.mode] | <code>number</code> | <code>0600</code> | the file mode to create with, defaults to 0600 on file and 0700 on directory |
| [options.prefix] | <code>string</code> | <code>&quot;Date.now()&quot;</code> | the optional prefix, fallbacks to tmp- if not provided |
| [options.postfix] | <code>string</code> | <code>&quot;&#x27;.tmp&#x27;&quot;</code> | the optional postfix, fallbacks to .tmp on file creation |
| [options.dir] | <code>string</code> | <code>&quot;/tmp&quot;</code> | the optional temporary directory, fallbacks to system default |
| [options.keep] | <code>boolean</code> | <code>false</code> | if to keep the file |

<a name="generateTmpName"></a>

## generateTmpName([options]) ⇒ <code>promise</code>
**Kind**: global function  
**Returns**: <code>promise</code> - - { path: ... }  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  |  |
| [options.mode] | <code>number</code> | <code>0600</code> | the file mode to create with, defaults to 0600 on file and 0700 on directory |
| [options.prefix] | <code>string</code> | <code>&quot;Date.now()&quot;</code> | the optional prefix, fallbacks to tmp- if not provided |
| [options.postfix] | <code>string</code> | <code>&quot;&#x27;.tmp&#x27;&quot;</code> | the optional postfix, fallbacks to .tmp on file creation |
| [options.dir] | <code>string</code> | <code>&quot;/tmp&quot;</code> | the optional temporary directory, fallbacks to system default |


## @coolgk/url
a javascript / typescript module

`npm install @coolgk/url`

a simple function for parsing parameters in a url

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { getParams } from '@coolgk/url';
// OR
// const { getParams } = require('@coolgk/url');

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
<a name="getParams"></a>

## getParams(url, pattern) ⇒ <code>object</code>
a simple function to get params in a url e.g. with url: user/123, pattern: user/:id returns {id: 123}

**Kind**: global function  
**Returns**: <code>object</code> - - e.g. {userid: 123}  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | url after the domain name e.g. http://abc.com/user/:id url should be /user/:id |
| pattern | <code>string</code> | e.g. /:userid/:name |


## @coolgk/unit
a javascript / typescript module

`npm install @coolgk/unit`

unit conversion

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { bytesToString, millisecondsToString } from '@coolgk/unit';
// OR
// const { bytesToString, millisecondsToString } = require('@coolgk/unit');

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
## Functions

<dl>
<dt><a href="#bytesToString">bytesToString(value)</a> ⇒ <code>string</code></dt>
<dd><p>or use <a href="https://www.npmjs.com/package/filesize">https://www.npmjs.com/package/filesize</a></p>
</dd>
<dt><a href="#millisecondsToString">millisecondsToString(value)</a> ⇒ <code>string</code></dt>
<dd></dd>
</dl>

<a name="bytesToString"></a>

## bytesToString(value) ⇒ <code>string</code>
or use https://www.npmjs.com/package/filesize

**Kind**: global function  
**Returns**: <code>string</code> - value in KB, MB, GB or TB  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>number</code> | value in byte |

<a name="millisecondsToString"></a>

## millisecondsToString(value) ⇒ <code>string</code>
**Kind**: global function  
**Returns**: <code>string</code> - value in second, minute, hour, day, month or year  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>number</code> | number of milliseconds |


## @coolgk/token
a javascript / typescript module

`npm install @coolgk/token`

an expirable, revocable, renewable token with data storage

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { Token } from '@coolgk/token';
import { createClient } from 'redis';
// OR
// const { Token } = require('@coolgk/token');
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
## Classes

<dl>
<dt><a href="#Token">Token</a></dt>
<dd></dd>
</dl>

## Constants

<dl>
<dt><a href="#TokenError">TokenError</a> : <code>object</code></dt>
<dd><p>Error Codes</p>
</dd>
</dl>

<a name="Token"></a>

## Token
**Kind**: global class  

* [Token](#Token)
    * [new Token(options)](#new_Token_new)
    * [.renew([expiry])](#Token+renew) ⇒ <code>promise</code>
    * [.set(name, value)](#Token+set) ⇒ <code>promise</code>
    * [.verify()](#Token+verify) ⇒ <code>promise.&lt;boolean&gt;</code>
    * [.get(name)](#Token+get) ⇒ <code>promise</code>
    * [.destroy()](#Token+destroy) ⇒ <code>promise</code>
    * [.delete(name)](#Token+delete) ⇒ <code>promise</code>
    * [.getAll()](#Token+getAll) ⇒ <code>promise.&lt;{}&gt;</code>
    * [.setToken(token)](#Token+setToken)

<a name="new_Token_new"></a>

### new Token(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  |  |
| options.token | <code>string</code> |  | token string for creating a token object |
| options.redisClient | <code>object</code> |  | redis client from redis.createClient() |
| [options.prefix] | <code>string</code> | <code>&quot;&#x27;token&#x27;&quot;</code> | prefix used in redis e.g. token:[TOKEN_STRING...] |
| [options.expiry] | <code>number</code> | <code>0</code> | in seconds. 0 = never expire |

<a name="Token+renew"></a>

### token.renew([expiry]) ⇒ <code>promise</code>
**Kind**: instance method of [<code>Token</code>](#Token)  

| Param | Type | Description |
| --- | --- | --- |
| [expiry] | <code>number</code> | in seconds |

<a name="Token+set"></a>

### token.set(name, value) ⇒ <code>promise</code>
set a data field value

**Kind**: instance method of [<code>Token</code>](#Token)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | field name |
| value | <code>\*</code> | anything can be JSON.stringify'ed |

<a name="Token+verify"></a>

### token.verify() ⇒ <code>promise.&lt;boolean&gt;</code>
verify if token has expired

**Kind**: instance method of [<code>Token</code>](#Token)  
<a name="Token+get"></a>

### token.get(name) ⇒ <code>promise</code>
get the value of a data field

**Kind**: instance method of [<code>Token</code>](#Token)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | data field name |

<a name="Token+destroy"></a>

### token.destroy() ⇒ <code>promise</code>
delete the token

**Kind**: instance method of [<code>Token</code>](#Token)  
<a name="Token+delete"></a>

### token.delete(name) ⇒ <code>promise</code>
delete a data field in the token

**Kind**: instance method of [<code>Token</code>](#Token)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | data field name |

<a name="Token+getAll"></a>

### token.getAll() ⇒ <code>promise.&lt;{}&gt;</code>
get the values of all data fields in the token

**Kind**: instance method of [<code>Token</code>](#Token)  
<a name="Token+setToken"></a>

### token.setToken(token)
set a new token string

**Kind**: instance method of [<code>Token</code>](#Token)  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>string</code> | new token string |

<a name="TokenError"></a>

## TokenError : <code>object</code>
Error Codes

**Kind**: global constant  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| INVALID_TOKEN | <code>string</code> | invalid token string |
| RESERVED_NAME | <code>string</code> | reserved names are used when setting token variables e.g. _timestamp |
| EXPIRED_TOKEN | <code>string</code> | token expired or renew() has not been called |


## @coolgk/url
a javascript / typescript module

`npm install @coolgk/url`

a simple function for parsing parameters in a url

Report bugs here: [https://github.com/coolgk/node-utils/issues](https://github.com/coolgk/node-utils/issues)
## Examples
```javascript
import { getParams } from '@coolgk/url';
// OR
// const { getParams } = require('@coolgk/url');

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
<a name="getParams"></a>

## getParams(url, pattern) ⇒ <code>object</code>
a simple function to get params in a url e.g. with url: user/123, pattern: user/:id returns {id: 123}

**Kind**: global function  
**Returns**: <code>object</code> - - e.g. {userid: 123}  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | url after the domain name e.g. http://abc.com/user/:id url should be /user/:id |
| pattern | <code>string</code> | e.g. /:userid/:name |

