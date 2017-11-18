'use strict';
exports.__esModule = true;
/*
Example:
blocking call functions in order
e.g.
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
*/
var promise = Promise.resolve();
/**
 * @param {function} callback - callback function that returns a promise
 */
function blockingCall(callback) {
    return promise = promise.then(function (data) { return callback(data); });
}
exports.blockingCall = blockingCall;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJsb2NraW5nQ2FsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7O0FBRWI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQTJCRTtBQUVGLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNoQzs7R0FFRztBQUNILHNCQUE4QixRQUFrQjtJQUM1QyxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBQyxJQUFJLElBQUssT0FBQSxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQWQsQ0FBYyxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQUZELG9DQUVDIiwiZmlsZSI6ImJsb2NraW5nQ2FsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuLypcbkV4YW1wbGU6XG5ibG9ja2luZyBjYWxsIGZ1bmN0aW9ucyBpbiBvcmRlclxuZS5nLlxuY29uc3QgYmxvY2tpbmdDYWxsID0gcmVxdWlyZSgnYmxvY2tpbmdDYWxsLmpzJyk7XG5cbmZ1bmN0aW9uIGEgKHgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQoKCkgPT4geyBjb25zb2xlLmxvZygnYScsIHgpOyByZXNvbHZlKCdhJykgfSwgMzAwKSk7XG59XG5cbmZ1bmN0aW9uIGIgKHgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQoKCkgPT4geyBjb25zb2xlLmxvZygnYicsIHgpOyByZXNvbHZlKCdiJykgfSwgMjAwKSk7XG59XG5cbmZ1bmN0aW9uIGMgKHgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQoKCkgPT4geyBjb25zb2xlLmxvZygnYycsIHgpOyByZXNvbHZlKCdjJykgfSwgMTAwKSk7XG59XG5cbi8vIGNhbGwgYSwgYiwgYyBpbiBvcmRlciBpLmUuIGIgd2lsbCBub3Qgc3RhcnQgdW50aWwgYSByZXNvbHZlc1xuYmxvY2tpbmdDYWxsKGEpO1xuYmxvY2tpbmdDYWxsKGIpO1xuYmxvY2tpbmdDYWxsKGMpO1xuXG4vLyBjYWxsIGEgNSB0aW1lcywgZWFjaCB3aWxsIHdhaXQgdW50aWwgcHJldmlvdXMgY2FsbCByZXNvbHZlc1xuWzEsMiwzLDQsNV0uZm9yRWFjaCgoKSA9PiB7XG4gICAgYmxvY2tpbmdDYWxsKGEpXG59KTtcbiovXG5cbmxldCBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4vKipcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgcHJvbWlzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvY2tpbmdDYWxsIChjYWxsYmFjazogRnVuY3Rpb24pOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBwcm9taXNlID0gcHJvbWlzZS50aGVuKChkYXRhKSA9PiBjYWxsYmFjayhkYXRhKSk7XG59XG4iXX0=
