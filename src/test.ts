import { Cache, CacheConfig } from './cache';
import { createClient } from 'redis';

const client = createClient({
    host: 'localhost',
    port: 6379,
    password: 'cQ4j3bJdfZtSQmzS7wTwJuxB3CSuhRUnLGEFANADkFmXUKXT8PxQKtpm92TeUH4AqJeyWaw%Rg9Q@kn@_qR%M`zs,$3v:Cj>ye5S{Q%q@84w'
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