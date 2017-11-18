'use strict';

/*
example:

let request = require('request.js');

request.get('https://httpbin.org/get?a=b').then((respose) => {
    console.dir(respose.statusCode, {colors:true});
    console.dir(respose.headers, {colors:true});
    console.dir(respose.data, {colors:true});
    // if respose.data is a json string, respose.json will return the json object
    console.dir(respose.json, {colors:true});
});

request.post('https://httpbin.org/post?a=b').then((respose) => {
    console.dir(respose.statusCode, {colors:true});
    console.dir(respose.headers, {colors:true});
    console.dir(respose.data, {colors:true});
    // if respose.data is a json string, respose.json will return the json object
    console.dir(respose.json, {colors:true});
});

*/

import * as url from 'url';

export interface RequestConfig {
    data?: any;
    headers?: {};
    method?: string;
};

/**
 * @param {object} options
 * @param {object} options.data - post data e.g. form data or files
 * @param {object} options.headers - http headers
 * @param {string} options.method - POST GET etc
 */
export function send (urlString: string, options = {}) {
    return new Promise((resolve, reject) => {
        options = Object.assign(url.parse(urlString), options);

        let request = require(options.protocol === 'http:' ? 'http' : 'https').request(options, (response) => {
            response.setEncoding('utf8');
            let data = '';
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => {
                resolve({
                    statusCode: response.statusCode,
                    headers: response.headers,
                    data: data,
                    get json () {
                        return JSON.parse(data);
                    }
                });
            });
        });

        request.on('error', (error) => {
            reject(error);
        });

        if (options.data) {
            request.write(options.data);
        }

        request.end();
    });
}

Request = {
    /**
     * @param {object} options
     * @param {object} options.headers - http headers
     */
    // get: (url, options = {}) => {
        // delete options.data;
        // return Request.send(url, options);
    // },

    /**
     * @param {object} options
     * @param {object} options.data - post data e.g. form data or files
     * @param {object} options.headers - http headers
     */
    // post: (url, options = {}) => {
        // options.data = require('querystring').stringify(options.data || {});
        // options.headers = Object.assign(options.headers || {}, {
            // 'Content-Type': 'application/x-www-form-urlencoded',
            // 'Content-Length': Buffer.byteLength(options.data)
        // });
        // options.method = 'POST';
        // return Request.send(url, options);
    // }
};
