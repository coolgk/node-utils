"use strict";
/*
Example

import { encode, decode, encodeUrl, decodeUrl } from './base64';

const a = 'https://www.google.co.uk/?a=b'
const hash = encode(a);
const urlHash = encodeUrl(a);

console.log(a);
console.log(hash);
console.log(decode(hash));

console.log(urlHash);
console.log(decodeUrl(urlHash));
*/
exports.__esModule = true;
function encode(data) {
    if (data === void 0) { data = ''; }
    return (new Buffer(data)).toString('base64');
}
exports.encode = encode;
function decode(data) {
    if (data === void 0) { data = ''; }
    return (new Buffer(data, 'base64')).toString();
}
exports.decode = decode;
/**
 * @param {string|array|buffer} data
 */
function encodeUrl(data) {
    if (data === void 0) { data = ''; }
    return encode(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
exports.encodeUrl = encodeUrl;
/**
 * @param {string} data - base64 encoded url to decode
 */
function decodeUrl(data) {
    if (data === void 0) { data = ''; }
    return decode((data + '==='.slice((data.length + 3) % 4)).replace(/\-/g, '+').replace(/_/g, '/'));
}
exports.decodeUrl = decodeUrl;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhc2U2NC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7OztFQWVFOztBQUVGLGdCQUF3QixJQUFpQjtJQUFqQixxQkFBQSxFQUFBLFNBQWlCO0lBQ3JDLE1BQU0sQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pELENBQUM7QUFGRCx3QkFFQztBQUVELGdCQUF3QixJQUFpQjtJQUFqQixxQkFBQSxFQUFBLFNBQWlCO0lBQ3JDLE1BQU0sQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ25ELENBQUM7QUFGRCx3QkFFQztBQUVEOztHQUVHO0FBQ0gsbUJBQTJCLElBQWlCO0lBQWpCLHFCQUFBLEVBQUEsU0FBaUI7SUFDeEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNsRixDQUFDO0FBRkQsOEJBRUM7QUFFRDs7R0FFRztBQUNILG1CQUEyQixJQUFpQjtJQUFqQixxQkFBQSxFQUFBLFNBQWlCO0lBQ3hDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN0RyxDQUFDO0FBRkQsOEJBRUMiLCJmaWxlIjoiYmFzZTY0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkV4YW1wbGVcblxuaW1wb3J0IHsgZW5jb2RlLCBkZWNvZGUsIGVuY29kZVVybCwgZGVjb2RlVXJsIH0gZnJvbSAnLi9iYXNlNjQnO1xuXG5jb25zdCBhID0gJ2h0dHBzOi8vd3d3Lmdvb2dsZS5jby51ay8/YT1iJ1xuY29uc3QgaGFzaCA9IGVuY29kZShhKTtcbmNvbnN0IHVybEhhc2ggPSBlbmNvZGVVcmwoYSk7XG5cbmNvbnNvbGUubG9nKGEpO1xuY29uc29sZS5sb2coaGFzaCk7XG5jb25zb2xlLmxvZyhkZWNvZGUoaGFzaCkpO1xuXG5jb25zb2xlLmxvZyh1cmxIYXNoKTtcbmNvbnNvbGUubG9nKGRlY29kZVVybCh1cmxIYXNoKSk7XG4qL1xuXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlIChkYXRhOiBzdHJpbmcgPSAnJyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIChuZXcgQnVmZmVyKGRhdGEpKS50b1N0cmluZygnYmFzZTY0Jyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGUgKGRhdGE6IHN0cmluZyA9ICcnKTogc3RyaW5nIHtcbiAgICByZXR1cm4gKG5ldyBCdWZmZXIoZGF0YSwgJ2Jhc2U2NCcpKS50b1N0cmluZygpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfGFycmF5fGJ1ZmZlcn0gZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlVXJsIChkYXRhOiBzdHJpbmcgPSAnJyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGVuY29kZShkYXRhKS5yZXBsYWNlKC9cXCsvZywgJy0nKS5yZXBsYWNlKC9cXC8vZywgJ18nKS5yZXBsYWNlKC89L2csICcnKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gZGF0YSAtIGJhc2U2NCBlbmNvZGVkIHVybCB0byBkZWNvZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVVybCAoZGF0YTogc3RyaW5nID0gJycpOiBzdHJpbmcge1xuICAgIHJldHVybiBkZWNvZGUoKGRhdGEgKyAnPT09Jy5zbGljZSgoZGF0YS5sZW5ndGggKyAzKSAlIDQpKS5yZXBsYWNlKC9cXC0vZywgJysnKS5yZXBsYWNlKC9fL2csICcvJykpO1xufVxuIl19
