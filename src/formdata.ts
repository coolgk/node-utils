import { tmpdir } from 'os';
import * as Busboy from 'busboy';
import { createWriteStream, stat } from 'fs';
import { generateFile } from './tmp';
import { parse as qsParse } from 'querystring';
import { IncomingMessage } from 'http';

export interface IFormdataConfig {
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

/* tslint:disable */
/**
 * @param {object} request - http.IncomingMessage, request parameter in createServer()'s callback or express request
 * @param {object} [globalOptions]
 * @param {number} [globalOptions.mode=0600] - file permission, defaults to 0600 on file and 0700 on directory
 * @param {string} [globalOptions.prefix=Date.now()] - the optional prefix
 * @param {string} [globalOptions.postfix='.tmp'] - the optional postfix
 * @param {string} [globalOptions.dir=os.tmpdir()] - the optional temporary directory, fallbacks to system default
 * @param {object} [globalOptions.limits]
 * @param {string} [globalOptions.limits.fieldNameSize]- Max field name size (in bytes) (Default: 100 bytes)
 * @param {string} [globalOptions.limits.fieldSize] - Max field value size (in bytes) (Default: 1MB).
 * @param {string} [globalOptions.limits.fields] - Max number of non-file fields (Default: Infinity)
 * @param {string} [globalOptions.limits.fileSize] - For multipart forms, the max file size (in bytes) (Default: Infinity)
 * @param {string} [globalOptions.limits.files] - For multipart forms, the max number of file fields (Default: Infinity)
 * @param {string} [globalOptions.limits.parts] - For multipart forms, the max number of parts (fields + files) (Default: Infinity)
 * @param {string} [globalOptions.limits.headerPairs] - For multipart forms, the max number of header key=>value pairs to parse Default: 2000 (same as node's http)
 * @param {string} [globalOptions.limits.postSize] - For application/json & application/x-www-form-urlencoded, the max number of bytes can be posted
 * @return {function} - parser function for 'application/json', 'application/x-www-form-urlencoded' and 'multipart/form-data'
 */
/* tslint:disable */
export default function formData (
    request: IncomingMessage, globalOptions: IFormdataConfig = {}
): (names: string[]) => Promise<IFormData> {

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

    /* tslint:disable */
    /**
     * @param {string[]} fileFieldNames - name of the file upload fields to store on disk
     * @param {object} [localOptions]
     * @param {number} [localOptions.mode=0600] - file permission, defaults to 0600 on file and 0700 on directory
     * @param {string} [localOptions.prefix=Date.now()] - the optional prefix
     * @param {string} [localOptions.postfix='.tmp'] - the optional postfix
     * @param {string} [localOptions.dir=os.tmpdir()] - the optional temporary directory, fallbacks to system default
     * @param {object} [localOptions.limits]
     * @param {string} [localOptions.limits.fieldNameSize]- Max field name size (in bytes) (Default: 100 bytes)
     * @param {string} [localOptions.limits.fieldSize] - Max field value size (in bytes) (Default: 1MB).
     * @param {string} [localOptions.limits.fields] - Max number of non-file fields (Default: Infinity)
     * @param {string} [localOptions.limits.fileSize] - For multipart forms, the max file size (in bytes) (Default: Infinity)
     * @param {string} [localOptions.limits.files] - For multipart forms, the max number of file fields (Default: Infinity)
     * @param {string} [localOptions.limits.parts] - For multipart forms, the max number of parts (fields + files) (Default: Infinity)
     * @param {string} [localOptions.limits.headerPairs] - For multipart forms, the max number of header key=>value pairs to parse Default: 2000 (same as node's http)
     * @param {string} [localOptions.limits.postSize] - For application/json & application/x-www-form-urlencoded, the max number of bytes can be posted
     * @return {promise}
     */
    /* tslint:disable */
    return (fileFieldNames: string[], localOptions: IFormdataConfig = {}): Promise<IFormData> => {
        const options = { ...globalOptions, ...localOptions };

        const postSize = options.limits ? options.limits.postSize || 102400 : 102400; // default 100kb
        const dir = options.dir || tmpdir(); // default upload dir
        const postfix = options.postfix || ''; // default file postfix

        const contentType = request.headers['content-type'] || '';
        if (!contentType) {
            return Promise.resolve({});
        }

        return new Promise((resolve, reject) => {
            if (parsers[contentType]) {
                let data: any[] = [];
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
                            resolve(
                                parsers[contentType](
                                    Buffer.concat(data).toString()
                                )
                            );
                        } catch (error) {
                            reject(error);
                        }
                    }
                });
            } else if (contentType.indexOf('multipart/form-data') === 0) {
                const busboy = new Busboy({ headers: request.headers, limits: options.limits });
                const promises: Promise<IFile>[] = [];
                busboy.on('file', async (fieldname, fileStream, filename, encoding, mimetype) => {
                    if (fileFieldNames.includes(fieldname)) {
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

                        fileStream.on('limit', (f) => {
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
                        data[fieldname] = value;
                    } else {
                        data[fieldname] = [value].concat(data[fieldname]);
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
                        (data[file.fieldname] as IFile[]).push(file);
                    });
                    resolve(data);
                });

                request.pipe(busboy);
            } else {
                resolve({});
            }
        });
    }
}
