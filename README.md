# utils

- [base64](#base64)
- [bcrypt](#bcrypt)
- blockingCall
- cache
- captcha
- request
- [tmp](#tmp)

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

## blockingCall

```TypeScript
const blockingCall = require('blockingCall.js');

function a (x) {
    return new Promise((resolve) => setTimeout(() => { console.log('a', x); resolve('a') }, 300));
}

function b (x) {
    return new Promise((resolve) => setTimeout(() => { console.log('b', x); resolve('b') }, 200));
}

function c (x) {
    return new Promise((resolve) => setTimeout(() => { console.log('c', x); resolve('c') }, 100));
}

// call a, b, c in order i.e. b will not start until a resolves
blockingCall(a);
blockingCall(b);
blockingCall(c);

// call a 5 times, each will wait until previous call resolves
[1,2,3,4,5].forEach(() => {
    blockingCall(a)
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
