/*
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
*/

import { stringify } from 'querystring';
import * as url from 'url';

export interface IRequestConfig {
    data?: {};
    headers?: {[propName: string]: string};
    method?: string;
    protocol?: string;
}

export interface IRequestResponse {
    statusCode: number;
    headers: {[propName: string]: string}[];
    data: string;
    json: {};
}

/**
 * @param {string} urlString - e.g. http://abc.com or https://xyz.com
 * @param {object} [options]
 * @param {object} [options.data] - post data e.g. form data or files
 * @param {object} [options.headers] - http headers
 * @param {string} [options.method='GET'] - POST GET etc
 * @return {promise}
 */
export function send (urlString: string, options: IRequestConfig = {}): Promise<IRequestResponse> {
    return new Promise((resolve, reject) => {
        options = Object.assign(url.parse(urlString), options);

        const request = require(options.protocol === 'http:' ? 'http' : 'https').request(options, (response) => {
            response.setEncoding('utf8');
            let data = '';
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => {
                const requestResponse: IRequestResponse = {
                    statusCode: response.statusCode,
                    headers: response.headers,
                    data,
                    get json () {
                        return JSON.parse(data);
                    }
                };
                resolve(requestResponse);
            });
        });

        request.on('error', (error: Error) => {
            reject(error);
        });

        if (options.data) {
            request.write(JSON.stringify(options.data));
        }

        request.end();
    });
}

/**
 * @param {string} urlString - e.g. http://abc.com or https://xyz.com
 * @param {object} [options]
 * @param {object} [options.headers] - http headers
 * @return {promise}
 */
export function get (urlString: string, options: IRequestConfig = {}): Promise<IRequestResponse> {
    delete options.data;
    return send(urlString, options);
}

/**
 * @param {string} urlString - e.g. http://abc.com or https://xyz.com
 * @param {object} [options]
 * @param {object} [options.data] - post data e.g. form data or files
 * @param {object} [options.headers] - http headers
 * @return {promise}
 */
export function post (urlString: string, options: IRequestConfig = {}): Promise<IRequestResponse> {
    options.headers = Object.assign(options.headers || {}, {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringify(options.data || {}))
    });
    options.method = 'POST';
    return send(urlString, options);
}
