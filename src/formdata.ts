/* tslint:disable */
/***
description: A http request form data parser (large file friendly) for 'application/json', 'application/x-www-form-urlencoded' and 'multipart/form-data'. It only parses form data when you ask for it.
version: 2.0.5
documentation: |
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
keywords:
    - form
    - post
    - json
    - x-www-form-urlencoded
    - multipart
    - form-data
    - formdata
    - express
    - middleware
    - promise
    - large file
    - file
    - upload
dependencies:
    "@coolgk/array": "^2"
    "@coolgk/tmp": "^2"
    "busboy": "^0.2.14"
    "@types/busboy": "^0.2.3"
    "@types/node": "^9"
*/
/* tslint:enable */

/*!
 *  Copyright (c) 2017 Daniel Gong <daniel.k.gong@gmail.com>. All rights reserved.
 *  Licensed under the MIT License.
 */

// multer does not seems to be very memory efficient for larger files
// other parsers have strange api

import { tmpdir } from 'os';
import * as Busboy from 'busboy';
import { createWriteStream, stat } from 'fs';
import { generateFile } from '@coolgk/tmp';
import { toArray } from '@coolgk/array';
import { parse as qsParse } from 'querystring';
import { IncomingMessage, ServerResponse } from 'http';

export interface IFormdataConfig {
    array?: boolean;
    mode?: number;
    prefix?: string;
    postfix?: string;
    dir?: string;
    limits?: {
        fieldNameSize?: number;
        fieldSize?: number;
        fields?: number;
        fileSize?: number;
        files?: number;
        parts?: number;
        headerPairs?: number;
        postSize?: number;
    };
    fileFieldNames?: string | string[];
    alwaysReject?: boolean;
}

/* tslint:disable */
/**
 * Error Codes
 * @const
 * @type {object}
 * @property {string} FILE_SIZE_EXCEEDED_LIMIT - size of uploaded file exceeded limit
 * @property {string} NUM_OF_NON_FILE_FIELDS_EXCEEDED_LIMIT - # of non file fields exceeded limit
 * @property {string} NUM_OF_FIELDS_EXCEEDED_LIMIT - # of fields posted exceeded limit
 * @property {string} NUM_OF_FILES_EXCEEDED_LIMIT - # of file fields exceeded limit
 * @property {string} POST_SIZE_EXCEEDED_LIMIT - the max number of bytes exceeded limit for application/json & application/x-www-form-urlencoded
 * @property {string} FIELD_SIZE_EXCEEDED_LIMIT - max field value size exceeded limit
 * @property {string} INVALID_JSON - invalid json data for application/json
 */
/* tslint:enable */
export enum FormDataError {
    FILE_SIZE_EXCEEDED_LIMIT = 'FILE_SIZE_EXCEEDED_LIMIT',
    NUM_OF_NON_FILE_FIELDS_EXCEEDED_LIMIT = 'NUM_OF_NON_FILE_FIELDS_EXCEEDED_LIMIT',
    NUM_OF_FIELDS_EXCEEDED_LIMIT = 'NUM_OF_FIELDS_EXCEEDED_LIMIT',
    NUM_OF_FILES_EXCEEDED_LIMIT = 'NUM_OF_FILES_EXCEEDED_LIMIT',
    POST_SIZE_EXCEEDED_LIMIT = 'POST_SIZE_EXCEEDED_LIMIT',
    FIELD_SIZE_EXCEEDED_LIMIT = 'FIELD_SIZE_EXCEEDED_LIMIT',
    // FIELD_NAME_SIZE_EXCEEDED_LIMIT = 'FIELD_NAME_SIZE_EXCEEDED_LIMIT',
    INVALID_JSON = 'INVALID_JSON'
}

export interface IFile {
    error?: string | Error;
    fieldname: string;
    filename: string;
    encoding: string;
    mimetype: string;
    size: number;
    path: string;
    remove: () => void;
}

export interface IFormData {
    [key: string]: string | string[] | IFile[] | IFile;
}

interface IBusboyFileStream extends NodeJS.ReadableStream {
    truncated: boolean;
}

// for assigngin property to request
export interface IRequest extends IncomingMessage {
    [key: string]: any;
}

// not sure how "fieldNameSize" works, it does not seem to work in "busboy": "^0.2.14"
// * @param {string} [options.limits.fieldNameSize=100]- Max field name size (in bytes), 'multipart/form-data' only

/* tslint:disable */
/**
 * the return value contains all normal post fields and the file upload fields that in "fileFieldNames" param
 *
 * @param {object} request - the request object in http.createServer() callback or express request
 * @param {object} [options]
 * @param {boolean} [options.array=false] - if to always get form data as array. By default values could either be string or array e.g. fieldname = val1, fieldname = [val1, val2]. if array is true, fieldname = val1 becomes fieldname = [val1]
 * @param {string[]|string} [options.fileFieldNames] - name of the file upload fields. Only file fields in this list are parsed, other files are ignored i.e. if someone sends a random huge file onto your server, it will not be stored in disk or memory.
 * @param {number} [options.mode=0600] - permission of the uploaded files, defaults to 0600 on file and 0700 on directory
 * @param {string} [options.prefix=Date.now()] - prefix for file names
 * @param {string} [options.postfix=''] - postfix for file names
 * @param {string} [options.dir=os.tmpdir()] - directory for storing the uploaded files, fallbacks to system default
 * @param {boolean} [options.alwaysReject=false] - if to reject the promise when fieldNameSize and fieldSize limits are exceeded. By default, field name and value will be truncated to their limits. 'multipart/form-data' only
 * @param {object} [options.limits]
 * @param {string} [options.limits.fieldSize=1024000] - Max field value size (in bytes) (Default: 1MB), 'multipart/form-data' only
 * @param {string} [options.limits.fields=Infinity] - Max number of non-file fields (Default: Infinity)
 * @param {string} [options.limits.fileSize=Infinity] - the max file size (in bytes) (Default: Infinity)
 * @param {string} [options.limits.files=Infinity] - the max number of file fields (Default: Infinity)
 * @param {string} [options.limits.parts=Infinity] - the max number of parts (fields + files) (Default: Infinity), 'multipart/form-data' only
 * @param {string} [options.limits.headerPairs=2000] - For multipart forms, the max number of header key=>value pairs to parse Default: 2000 (same as node's http)
 * @param {string} [options.limits.postSize=1024000] - the max number of bytes can be posted. For application/json & application/x-www-form-urlencoded only
 * @return {promise<{}>} - { fieldname: value, uploadedFileName: { error: ..., fieldname: ..., filename: ..., encoding: ..., mimetype: ..., size: ..., path: ..., remove: () => void } } "remove" is a callback function for deleting the uploaded file
 */
/* tslint:enable */
export function getFormData (
    request: IncomingMessage,
    options: IFormdataConfig = {}
): Promise<IFormData> {
    const parsers: {
        [key: string]: (data: string) => {};
    } = {
        'application/json': (data: string) => {
            try {
                return JSON.parse(data);
            } catch (error) {
                throw FormDataError.INVALID_JSON;
            }
        },
        'application/x-www-form-urlencoded': qsParse
    };

    const postSize = options.limits ? options.limits.postSize || 1024000 : 1024000; // default 1mb
    const fieldsLimit = options.limits ? options.limits.fields || Infinity : Infinity; // default unlimited
    const dir = options.dir || tmpdir(); // default upload dir
    const postfix = options.postfix || ''; // default file postfix

    const contentType = request.headers['content-type'] || '';
    if (!contentType) {
        return Promise.resolve({});
    }

    return new Promise((resolve, reject) => {
        if (parsers[contentType]) {
            const data: any[] = [];
            let size: number = 0;
            let overSize: boolean = false;
            request.on('data', (chunk) => {
                size += chunk.length;
                if (size <= postSize) {
                    data.push(chunk);
                } else {
                    overSize = true;
                }
            });

            request.on('error', (error) => reject(error));

            request.on('end', () => {
                if (overSize) {
                    reject(FormDataError.POST_SIZE_EXCEEDED_LIMIT);
                } else {
                    try {
                        const jsonData: {[key: string]: string | string[]} = parsers[contentType](
                            Buffer.concat(data).toString()
                        );

                        if (Object.keys(jsonData).length > fieldsLimit) {
                            return reject(FormDataError.NUM_OF_FIELDS_EXCEEDED_LIMIT);
                        }

                        if (options.array) {
                            for (const property in jsonData) {
                                jsonData[property] = toArray(jsonData[property]);
                            }
                        }
                        resolve(jsonData);
                    } catch (error) {
                        reject(error);
                    }
                }
            });
        } else if (contentType.indexOf('multipart/form-data') === 0) {
            const busboy = new Busboy({ headers: request.headers, limits: options.limits });
            const promises: Promise<IFile>[] = [];

            if (options.fileFieldNames) {
                busboy.on('file', async (fieldname, fileStream, filename, encoding, mimetype) => {
                    if (toArray(options.fileFieldNames).includes(fieldname)) {
                        const { path, cleanupCallback } = await generateFile({
                            dir,
                            postfix,
                            prefix: options.prefix,
                            mode: options.mode,
                            keep: true
                        });

                        const file: IFile = {
                            fieldname,
                            filename,
                            encoding,
                            mimetype,
                            size: 0,
                            path,
                            remove: cleanupCallback
                        };

                        fileStream.on('end', () => {
                            if ((fileStream as IBusboyFileStream).truncated) {
                                file.error = FormDataError.FILE_SIZE_EXCEEDED_LIMIT;
                            }
                        });

                        promises.push(new Promise((done, rejectFile) => {
                            fileStream.pipe(createWriteStream(path)).on('finish', () => {
                                stat(path, (error, stats) => {
                                    done({error, ...file, size: stats.size});
                                });
                            });
                        }));
                    } else {
                        fileStream.resume();
                    }
                });
            }

            const data: IFormData = {};
            busboy.on('field', (fieldname, value, fieldnameTruncated, valueTruncated) => {
                if (options.alwaysReject) {
                    // if (fieldnameTruncated) {
                        // return reject(FormDataError.FIELD_NAME_SIZE_EXCEEDED_LIMIT);
                    // }
                    if (valueTruncated) {
                        return reject(FormDataError.FIELD_SIZE_EXCEEDED_LIMIT);
                    }
                }

                if (!data[fieldname]) {
                    data[fieldname] = options.array ? [value] : value;
                } else {
                    data[fieldname] = toArray(data[fieldname]).concat(value);
                }
            });

            busboy.on('partsLimit', () => reject(FormDataError.NUM_OF_FIELDS_EXCEEDED_LIMIT));
            busboy.on('filesLimit', () => reject(FormDataError.NUM_OF_FILES_EXCEEDED_LIMIT));
            busboy.on('fieldsLimit', () => reject(FormDataError.NUM_OF_NON_FILE_FIELDS_EXCEEDED_LIMIT));

            busboy.on('error', (error: Error) => {
                reject(error);
            });

            busboy.on('finish', async () => {
                (await Promise.all(promises)).forEach((file) => {
                    if (file.error) {
                        file.remove();
                        // file.size = 0;
                        // file.path = ''; // need this for unit test to check if file has been deleted
                    }

                    if (!data[file.fieldname]) {
                        data[file.fieldname] = options.array ? [file] : file;
                    } else {
                        // (data[file.fieldname] as IFile[]).push(file);
                        data[file.fieldname] = toArray(data[file.fieldname]).concat(file);
                    }
                });
                resolve(data);
            });

            request.pipe(busboy);
        } else {
            resolve({});
        }
    });
}

/* tslint:disable */
/**
 * @see getFormData()
 * @param {object} request - http.IncomingMessage, request parameter in createServer()'s callback or express request
 * @param {object} [globalOptions] - see the "option" param of getFormData()
 * @return {object} - { getData: (fileFieldNames, options) => ... } see "fileFieldNames" and "options" and the return value of getFormData()
 */
/* tslint:enable */
export function formData (
    request: IncomingMessage, globalOptions: IFormdataConfig = {}
): {getData: (names: string[] | string, options: IFormdataConfig) => Promise<IFormData>} {
    return {
        getData: (fileFieldNames: string[] | string, localOptions: IFormdataConfig = {}): Promise<IFormData> => {
            return getFormData(request, { ...globalOptions, ...localOptions, fileFieldNames });
        }
    };
}

export interface IExpressFormdataConfig extends IFormdataConfig {
    requestFieldName?: string;
}

/* tslint:disable */
/**
 * @see getFormData()
 * @param {object} [options] - see the "option" param of getFormData()
 * @param {object} [options.requestFieldName='formdata'] - field name to be assigned to the request object. by default it assigns to request.formdata
 * @return {function} - (request, response, next) => ... see the return value of getFormData()
 */
/* tslint:enable */
export function express (
    options: IExpressFormdataConfig = {}
): (request: IRequest, response: ServerResponse, next: () => void) => void {
    return (request, response, next) => {
        request[options.requestFieldName || 'formdata'] = formData(request, options);
        next();
    };
}

export default getFormData;
