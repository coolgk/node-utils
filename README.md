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

## base64

```TypeScript
import { encode, decode, encodeUrl, decodeUrl } from './base64';

const a = 'https://www.google.co.uk/?a=b'
const hash = encode(a);
const urlHash = encodeUrl(a);

console.log(a);
console.log(hash);
console.log(decode(hash));

console.log(urlHash);
console.log(decodeUrl(urlHash));
```

## bcrypt

```TypeScript
import { encrypt, verify } from './bcrypt';

const password = 'abc123';

encrypt(password).then((hash) => {
    verify(password, hash).then(console.log);

    verify(password, 'invalidhash').then(console.log, console.error);

    verify('invalidpass', hash).then(console.log);
});
```

## queue

```TypeScript
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

// run limit to run two jobs at a time
[1,2,3,4,5,6,7,8,9,10].forEach(() => {
    queue(a, 3)
});
```

## cache

```TypeScript
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

cache.set('abc', {a: 1}, 1).then(console.log);

cache.get('abc').then(console.log);

setTimeout(() => {
    cache.get('abc').then(console.log);
    client.quit();
}, 1500);

cache.getSetIfNull(
    'abc',
    () => Promise.resolve('data'),
    10
).then((v) => {
    console.log('-----', v);
});
```

## captcha

```TypeScript
import { Captcha } from './captcha';

const captcha = new Captcha({
	secret: '---'
});

captcha.verify('input_response', 'ip').then((response) => {
	console.log(response);
});
```

## request

```TypeScript
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

```TypeScript
import { generateFile, generateDir, generateTmpName } from './tmp';

generateFile({dir: '/tmp/test'}).then((r) => console.log('file', r));

generateDir({dir: '/tmp/test'}).then((r) => console.log('dir',r));

generateTmpName({dir: '/tmp/test'}).then((r) => console.log('name', r));
```

## csv
```TypeScript
import { CsvConfig, CsvReadConfig, CsvWriteConfig, Csv } from './csv';

const csv = new Csv();

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
```TypeScript
import { Email } from './email';

let email = new Email({
    host: 'localhost'
});
email.send({
    subject: 'hello this is email subject',
    from: {
            name: 'Daniel Gong',
            email: 'daniel.gong@carboncredentials.com'
    },
    to: [
        {
            name: 'Cian Duggan',
            email: 'daniel.gong+abc@carboncredentials.com'
        },
        'dev@carboncredentials.com'
    ],
    message: '<html><body><h1>test</h1>some message here <img src="cid:my-image" width="500" height="250"></body></html>',
    attachments: [
        {
            path: '/var/www/clientportalapi/uploads/portal2.png',
            name: 'screenshot.png',
            type: 'image/png'
        },
        {
            path:"/var/www/clientportalapi/uploads/portal2.png",
            type:"image/png",
            headers:{"Content-ID": "<my-image>"}
        }
    ]
}).then((sentMessage) => {
    console.log(sentMessage);
}).catch((error) => {
    console.log(error);
});
```