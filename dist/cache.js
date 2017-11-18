"use strict";
/*
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
*/
exports.__esModule = true;
var Cache = /** @class */ (function () {
    /**
     * @param {object} options -
     * @param {object} options.redisClient - redis client
     */
    function Cache(options) {
        this._redisClient = options.redisClient;
    }
    /**
     * @param {string} command - redis command to run
     * @param {*} params - params for the command
     */
    Cache.prototype.command = function (command) {
        var _this = this;
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        return new Promise(function (resolve, reject) {
            params.push(function (error, response) {
                error ? reject(error) : resolve(response);
            });
            (_a = _this._redisClient)[command].apply(_a, params);
            var _a;
        });
    };
    /**
     * @param {string} name - name of the variable
     * @param {*} value - value is always JSON.stringify'ed
     * @param {number} [expiry = 0] - expire time in seconds. 0 = never expire
     */
    Cache.prototype.set = function (name, value, expiry) {
        if (expiry === void 0) { expiry = 0; }
        return expiry ? this.command('setex', name, expiry, JSON.stringify(value)) : this.command('set', name, JSON.stringify(value));
    };
    /**
     * @param {string} name - name of the variable
     */
    Cache.prototype.get = function (name) {
        return this.command('get', name).then(function (value) {
            return Promise.resolve(JSON.parse(value));
        });
    };
    /**
     * this method tries to get the cached value
     * if not found in cache, it resolves the "value" parameter and saves the value to cache then returns it
     *
     * @param {string} name - name of the variable
     * @param {function} callback - a callback function which returns a value or a promise
     * @param {number} [expiry = 0] - expire time in seconds. 0 = never expire
     * @return {promise}
     */
    Cache.prototype.getSetIfNull = function (name, callback, expiry) {
        var _this = this;
        if (expiry === void 0) { expiry = 0; }
        return this.get(name).then(function (cachedValue) {
            if (null === cachedValue) {
                return Promise.resolve(callback()).then(function (value) { return _this.set(name, value, expiry).then(function () { return value; }); });
            }
            return cachedValue;
        });
    };
    return Cache;
}());
exports.Cache = Cache;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFnQ0U7O0FBUUY7SUFFSTs7O09BR0c7SUFDSCxlQUFhLE9BQW9CO1FBQzdCLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQztJQUM1QyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsdUJBQU8sR0FBUCxVQUFTLE9BQWU7UUFBeEIsaUJBT0M7UUFQeUIsZ0JBQWdCO2FBQWhCLFVBQWdCLEVBQWhCLHFCQUFnQixFQUFoQixJQUFnQjtZQUFoQiwrQkFBZ0I7O1FBQ3RDLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1lBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBQyxLQUFLLEVBQUUsUUFBUTtnQkFDeEIsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5QyxDQUFDLENBQUMsQ0FBQztZQUNILENBQUEsS0FBQSxLQUFJLENBQUMsWUFBWSxDQUFBLENBQUMsT0FBTyxDQUFDLFdBQUksTUFBTSxFQUFFOztRQUMxQyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsbUJBQUcsR0FBSCxVQUFLLElBQVksRUFBRSxLQUFVLEVBQUUsTUFBVTtRQUFWLHVCQUFBLEVBQUEsVUFBVTtRQUNyQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNsSSxDQUFDO0lBRUQ7O09BRUc7SUFDSCxtQkFBRyxHQUFILFVBQUssSUFBWTtRQUNiLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxLQUFLO1lBQ3hDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUM5QyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILDRCQUFZLEdBQVosVUFBYyxJQUFZLEVBQUUsUUFBa0IsRUFBRSxNQUFVO1FBQTFELGlCQVdDO1FBWCtDLHVCQUFBLEVBQUEsVUFBVTtRQUN0RCxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxXQUFXO1lBQ25DLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUN2QixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FDbkMsVUFBQyxLQUFLLElBQUssT0FBQSxLQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUN6QyxjQUFNLE9BQUEsS0FBSyxFQUFMLENBQUssQ0FDZCxFQUZVLENBRVYsQ0FDSixDQUFDO1lBQ04sQ0FBQztZQUNELE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUwsWUFBQztBQUFELENBL0RBLEFBK0RDLElBQUE7QUEvRFksc0JBQUsiLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuaW1wb3J0IHsgQ2FjaGUsIENhY2hlQ29uZmlnIH0gZnJvbSAnLi9jYWNoZSc7XG5pbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tICdyZWRpcyc7XG5cbmNvbnN0IGNsaWVudCA9IGNyZWF0ZUNsaWVudCh7XG4gICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgcG9ydDogNjM3OSxcbiAgICBwYXNzd29yZDogJy0tLSdcbn0pO1xuXG5jb25zdCBjb25maWc6IENhY2hlQ29uZmlnID0ge1xuICAgIHJlZGlzQ2xpZW50OiBjbGllbnRcbn07XG5cbmNvbnN0IGNhY2hlID0gbmV3IENhY2hlKGNvbmZpZyk7XG5cbmNhY2hlLnNldCgnYWJjJywge2E6IDF9LCAxKS50aGVuKGNvbnNvbGUubG9nKTtcblxuY2FjaGUuZ2V0KCdhYmMnKS50aGVuKGNvbnNvbGUubG9nKTtcblxuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgY2FjaGUuZ2V0KCdhYmMnKS50aGVuKGNvbnNvbGUubG9nKTtcbiAgICBjbGllbnQucXVpdCgpO1xufSwgMTUwMCk7XG5cbmNhY2hlLmdldFNldElmTnVsbChcbiAgICAnYWJjJyxcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoJ2RhdGEnKSxcbiAgICAxMFxuKS50aGVuKCh2KSA9PiB7XG4gICAgY29uc29sZS5sb2coJy0tLS0tJywgdik7XG59KTtcbiovXG5cbmltcG9ydCB7IFJlZGlzQ2xpZW50IH0gZnJvbSAncmVkaXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIENhY2hlQ29uZmlnIHtcbiAgICByZWFkb25seSByZWRpc0NsaWVudDogUmVkaXNDbGllbnQ7XG59XG5cbmV4cG9ydCBjbGFzcyBDYWNoZSB7XG4gICAgcHJpdmF0ZSBfcmVkaXNDbGllbnQ6IFJlZGlzQ2xpZW50O1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIC1cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5yZWRpc0NsaWVudCAtIHJlZGlzIGNsaWVudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChvcHRpb25zOiBDYWNoZUNvbmZpZykge1xuICAgICAgICB0aGlzLl9yZWRpc0NsaWVudCA9IG9wdGlvbnMucmVkaXNDbGllbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbW1hbmQgLSByZWRpcyBjb21tYW5kIHRvIHJ1blxuICAgICAqIEBwYXJhbSB7Kn0gcGFyYW1zIC0gcGFyYW1zIGZvciB0aGUgY29tbWFuZFxuICAgICAqL1xuICAgIGNvbW1hbmQgKGNvbW1hbmQ6IHN0cmluZywgLi4ucGFyYW1zOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBwYXJhbXMucHVzaCgoZXJyb3IsIHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgZXJyb3IgPyByZWplY3QoZXJyb3IpIDogcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX3JlZGlzQ2xpZW50W2NvbW1hbmRdKC4uLnBhcmFtcyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gbmFtZSBvZiB0aGUgdmFyaWFibGVcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIC0gdmFsdWUgaXMgYWx3YXlzIEpTT04uc3RyaW5naWZ5J2VkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtleHBpcnkgPSAwXSAtIGV4cGlyZSB0aW1lIGluIHNlY29uZHMuIDAgPSBuZXZlciBleHBpcmVcbiAgICAgKi9cbiAgICBzZXQgKG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgZXhwaXJ5ID0gMCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBleHBpcnkgPyB0aGlzLmNvbW1hbmQoJ3NldGV4JywgbmFtZSwgZXhwaXJ5LCBKU09OLnN0cmluZ2lmeSh2YWx1ZSkpIDogdGhpcy5jb21tYW5kKCdzZXQnLCBuYW1lLCBKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gbmFtZSBvZiB0aGUgdmFyaWFibGVcbiAgICAgKi9cbiAgICBnZXQgKG5hbWU6IHN0cmluZyk6IFByb21pc2U8e30+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tbWFuZCgnZ2V0JywgbmFtZSkudGhlbigodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoSlNPTi5wYXJzZSh2YWx1ZSkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB0aGlzIG1ldGhvZCB0cmllcyB0byBnZXQgdGhlIGNhY2hlZCB2YWx1ZVxuICAgICAqIGlmIG5vdCBmb3VuZCBpbiBjYWNoZSwgaXQgcmVzb2x2ZXMgdGhlIFwidmFsdWVcIiBwYXJhbWV0ZXIgYW5kIHNhdmVzIHRoZSB2YWx1ZSB0byBjYWNoZSB0aGVuIHJldHVybnMgaXRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gbmFtZSBvZiB0aGUgdmFyaWFibGVcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIGEgY2FsbGJhY2sgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhIHZhbHVlIG9yIGEgcHJvbWlzZVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbZXhwaXJ5ID0gMF0gLSBleHBpcmUgdGltZSBpbiBzZWNvbmRzLiAwID0gbmV2ZXIgZXhwaXJlXG4gICAgICogQHJldHVybiB7cHJvbWlzZX1cbiAgICAgKi9cbiAgICBnZXRTZXRJZk51bGwgKG5hbWU6IHN0cmluZywgY2FsbGJhY2s6IEZ1bmN0aW9uLCBleHBpcnkgPSAwKTogUHJvbWlzZTx7fT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXQobmFtZSkudGhlbigoY2FjaGVkVmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmIChudWxsID09PSBjYWNoZWRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FsbGJhY2soKSkudGhlbihcbiAgICAgICAgICAgICAgICAgICAgKHZhbHVlKSA9PiB0aGlzLnNldChuYW1lLCB2YWx1ZSwgZXhwaXJ5KS50aGVuKFxuICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT4gdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkVmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH1cblxufVxuIl19
