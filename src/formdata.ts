
// 'application/json', 'application/x-www-form-urlencoded' and 'multipart/form-data'
// "@coolgk/array": "^1.0.9"

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
 * @property {string} INVALID_JSON - invalid json data for application/json
 */
/* tslint:enable */
export enum FormDataError {
    FILE_SIZE_EXCEEDED_LIMIT = 'FILE_SIZE_EXCEEDED_LIMIT',
    NUM_OF_NON_FILE_FIELDS_EXCEEDED_LIMIT = 'NUM_OF_NON_FILE_FIELDS_EXCEEDED_LIMIT',
    NUM_OF_FIELDS_EXCEEDED_LIMIT = 'NUM_OF_FIELDS_EXCEEDED_LIMIT',
    NUM_OF_FILES_EXCEEDED_LIMIT = 'NUM_OF_FILES_EXCEEDED_LIMIT',
    POST_SIZE_EXCEEDED_LIMIT = 'POST_SIZE_EXCEEDED_LIMIT',
    INVALID_JSON = 'INVALID_JSON'
}

export interface IFile {
    error: string;
    fieldname: string;
    filename: string;
    encoding: string;
    mimetype: string;
    size: number;
    path: string;
    remove: () => void;
}

export interface IFormData {
    [key: string]: string | string[] | IFile[];
}

// for assigngin property to request
export interface IRequest extends IncomingMessage {
    [key: string]: any;
}

/* tslint:disable */
/**
 * the return value contains all normal post fields and the file upload fields that in "fileFieldNames" param
 *
 * @param {object} request - http.IncomingMessage, request parameter in createServer()'s callback or express request
 * @param {string[]|string} fileFieldNames - name of the file upload fields
 * @param {object} [options]
 * @param {boolean} [options.array=false] - if to always get form data as array. By default values could either be string or array e.g. fieldname = val1, fieldname = [val1, val2]. if array is true, fieldname = val1 becomes fieldname = [val1]
 * @param {number} [options.mode=0600] - permission of the uploaded files, defaults to 0600 on file and 0700 on directory
 * @param {string} [options.prefix=Date.now()] - prefix for file names
 * @param {string} [options.postfix=''] - postfix for file names
 * @param {string} [options.dir=os.tmpdir()] - directory for storing the uploaded files, fallbacks to system default
 * @param {object} [options.limits]
 * @param {string} [options.limits.fieldNameSize]- Max field name size (in bytes) (Default: 100 bytes)
 * @param {string} [options.limits.fieldSize] - Max field value size (in bytes) (Default: 1MB).
 * @param {string} [options.limits.fields] - Max number of non-file fields (Default: Infinity)
 * @param {string} [options.limits.fileSize] - For multipart forms, the max file size (in bytes) (Default: Infinity)
 * @param {string} [options.limits.files] - For multipart forms, the max number of file fields (Default: Infinity)
 * @param {string} [options.limits.parts] - For multipart forms, the max number of parts (fields + files) (Default: Infinity)
 * @param {string} [options.limits.headerPairs] - For multipart forms, the max number of header key=>value pairs to parse Default: 2000 (same as node's http)
 * @param {string} [options.limits.postSize] - For application/json & application/x-www-form-urlencoded, the max number of bytes can be posted
 * @return {promise<{}>} - { fieldname: value, uploadedFileName: { error: ..., fieldname: ..., filename: ..., encoding: ..., mimetype: ..., size: ..., path: ..., remove: () => void } } "remove" is a callback function for deleting the uploaded file
 */
/* tslint:enable */
export function getFormData (
    request: IncomingMessage,
    fileFieldNames: string[] | string,
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

    const postSize = options.limits ? options.limits.postSize || 102400 : 102400; // default 100kb
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

            busboy.on('file', async (fieldname, fileStream, filename, encoding, mimetype) => {
                if (toArray(fileFieldNames).includes(fieldname)) {
                    const { path, cleanupCallback } = await generateFile({
                        dir,
                        postfix,
                        prefix: options.prefix,
                        mode: options.mode,
                        keep: true
                    });

                    const file: IFile = {
                        error: '',
                        fieldname,
                        filename,
                        encoding,
                        mimetype,
                        size: 0,
                        path,
                        remove: cleanupCallback
                    };

                    fileStream.on('limit', () => {
                        file.error = FormDataError.FILE_SIZE_EXCEEDED_LIMIT;
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

            const data: IFormData = {};
            busboy.on('field', (fieldname, value) => {
                if (!data[fieldname]) {
                    data[fieldname] = options.array ? [value] : value;
                } else {
                    data[fieldname] = toArray(value).concat(data[fieldname]);
                }
            });

            busboy.on('partsLimit', () => reject(FormDataError.NUM_OF_FIELDS_EXCEEDED_LIMIT));
            busboy.on('filesLimit', () => reject(FormDataError.NUM_OF_FILES_EXCEEDED_LIMIT));
            busboy.on('fieldsLimit', () => reject(FormDataError.NUM_OF_NON_FILE_FIELDS_EXCEEDED_LIMIT));

            busboy.on('finish', async () => {
                (await Promise.all(promises)).forEach((file) => {
                    if (!data[file.fieldname]) {
                        data[file.fieldname] = [];
                    }
                    if (file.error) {
                        file.remove();
                        file.size = 0;
                        file.path = '';
                    }
                    // (data[file.fieldname] as IFile[]).push(file);
                    data[file.fieldname] = toArray(data[file.fieldname]).concat(file);
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
            return getFormData(request, fileFieldNames, { ...globalOptions, ...localOptions });
        }
    };
}

/* tslint:disable */
/**
 * @see getFormData()
 * @param {string} [requestFieldName] - field name to be used on the request object. by default it assigns to request.formdata
 * @param {object} [options] - see the "option" param of getFormData()
 * @return {function} - (request, response, next) => ... see the return value of getFormData()
 */
/* tslint:enable */
export function express (
    requestFieldName: string = 'formdata',
    options: IFormdataConfig = {}
): (request: IRequest, response: ServerResponse, next: () => void) => void {
    return (request, response, next) => {
        request[requestFieldName] = formData(request, options);
        next();
    };
}

export default getFormData;
