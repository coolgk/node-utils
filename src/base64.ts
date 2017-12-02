/**
 * @param {string} data - string to encode
 * @return {string}
 */
export function encode (data: string = ''): string {
    return (new Buffer(data)).toString('base64');
}

/**
 * @param {string} data - encoded hash
 * @return {string}
 */
export function decode (data: string = ''): string {
    return (new Buffer(data, 'base64')).toString();
}

/**
 * @param {string} data - string to encode
 * @return {string}
 */
export function encodeUrl (data: string = ''): string {
    return encode(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * @param {string} data - base64 encoded url to decode
 * @return {string}
 */
export function decodeUrl (data: string = ''): string {
    return decode((data + '==='.slice((data.length + 3) % 4)).replace(/\-/g, '+').replace(/_/g, '/'));
}
