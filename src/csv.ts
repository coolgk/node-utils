/* tslint:disable */
/***
description: read and write csv files
keywords:
    - csv
    - csv parser
    - csr writer
dependencies:
    "@types/mongodb": "^3"
    "@types/csv-parse": "^1.1.11"
    "@types/csv-stringify": "^1.4.1"
    "csv-parse": "^2.0.0"
    "csv-stringify": "^2.0.0"
    "@coolgk/queue": "^2"
    "@coolgk/tmp": "^2"
example: |
    import { Csv } from '@coolgk/csv';
    // OR
    // const { Csv } = require('@coolgk/csv');

    const csv = new Csv({
        tmpConfig: { dir: '/tmp/csv' } // optional
    });

    const arrayData = [
        [1,2,3,4,5],
        [6,7,7,8,9],
        [0,5,8,90,65]
    ];

    const objectData = [
        {col1: 'ab', col2: 'cd', col3: 'ef'},
        {col1: '2ab', col2: '2cd', col3: '2ef'},
        {col1: '3ab', col2: '3cd', col3: '3ef'}
    ];

    csv.createFile(
        arrayData,
        {
            columns: ['column 1', 'column 2', 'column 3', 'h4', 'h5'],
            formatter: (row) => {
                return row.map((value) => 'formatted-' + value);
            }
        }
    ).then((csvFilePath) => {
        console.log(csvFilePath); // /tmp/csv/151229255018910356N9qKqUgrpzG2.csv
        read(csvFilePath, ['column 1', 'column 2', 'column 3', 'h4', 'h5']);
    });

    csv.createFile(
        objectData,
        {
            columns: ['col1', 'col2', 'col3'],
            formatter: (row) => {
                return [row.col1 + '+format', row.col2 + '+format', row.col3 + '+format'];
            }
        }
    ).then((csvFilePath) => {
        console.log(csvFilePath); // /tmp/csv/151229255019910356AlO9kbzkdqjq.csv
        read(csvFilePath, ['col1', 'col2', 'col3']);
    });

    function read (file, columns) {
        // with columns/headers
        // read lines as object
        const lines = csv.readFile(file, {columns: columns});
        lines.forEach(
            (lineArray, index) => {
                console.log(lineArray, index);
                // {
                    // 'column 1': 'formatted-1',
                    // 'column 2': 'formatted-2',
                    // 'column 3': 'formatted-3',
                    // h4: 'formatted-4',
                    // h5: 'formatted-5'
                // } 1
            },
            (total) => {
                console.log('read done, total:', total); // read done, total: 4
            }
        );

        // without columns/headers
        // read lines as array
        const lines2 = csv.readFile(file);
        lines2.forEach(
            (lineArray, index) => {
                console.log(lineArray, index); // [ 'formatted-1', 'formatted-2', 'formatted-3', 'formatted-4', 'formatted-5' ] 1
            },
            (total) => {
                console.log('read done, total:', total); // read done, total: 4
            }
        );
    }
*/
/* tslint:enable */

// npm i -S csv-stringify @types/csv-stringify csv-parse @types/csv-parse @types/mongodb

import csvParse = require('csv-parse');
import csvStringify = require('csv-stringify');
import { queue } from '@coolgk/queue';
import { generateFile, ITmpConfig } from '@coolgk/tmp';
import { createReadStream, createWriteStream, WriteStream } from 'fs';
import { Cursor } from 'mongodb';

export interface ICsvConfig {
    readonly generateFile?: typeof generateFile; // DI for test
    readonly csvStringify?: typeof csvStringify; // DI for test
    readonly csvParse?: typeof csvParse; // DI for test
    readonly tmpConfig?: ITmpConfig;
}

export interface ICsvReadConfig {
    columns?: string[];
    limit?: number;
    delimiter?: string;
}

export interface ICsvWriteConfig {
    columns?: string[];
    delimiter?: string;
    filepath?: string;
    formatter?: (data: {[propName: string]: any} | any[]) => string[];
}

export interface IReadFileResponse {
    forEach: (
        callback: (row: any, index: number) => void,
        endCallback: (rowCount: number) => void
    ) => void;
}

export class Csv {

    private _csvParse: typeof csvParse; // DI for test
    private _csvStringify: typeof csvStringify; // DI for test
    private _generateFile: typeof generateFile; // DI for test
    private _tmpConfig: ITmpConfig;

    /* tslint:disable */
    /**
     * @param {object} [options]
     * @param {object} [options.tmpConfig] - config for the generated file
     * @param {number} [options.tmpConfig.mode=0600] - the file mode to create with, defaults to 0600 on file and 0700 on directory
     * @param {string} [options.tmpConfig.prefix=Date.now()] - the optional prefix
     * @param {string} [options.tmpConfig.dir=os.tmpdir()] - the optional temporary directory, fallbacks to system default
     */
    /* tslint:enable */
    public constructor (options: ICsvConfig = {}) {
        this._csvStringify = options.csvStringify || csvStringify;
        this._csvParse = options.csvParse || csvParse;
        this._generateFile = options.generateFile || generateFile;
        this._tmpConfig = options.tmpConfig || {};
    }

    /* tslint:disable */
    /**
     * parse a string as csv data and returns an array promise
     * @param {string} value - a csv string
     * @param {object} [options]
     * @param {string[]} [options.columns] - array of headers e.g. ['id', 'name', ...] if headers is defined, the row value will be objects
     * @param {number} [options.limit=0] - number of rows to read, 0 = unlimited
     * @param {string} [options.delimiter=','] - csv delimiter
     * @return {promise<array>}
     */
    /* tslint:enable */
    public parse (value: string, options: ICsvReadConfig = {}): Promise<any[]> {
        return new Promise(
            (resolve, reject) => this._csvParse(
                value, options, (error, output) => error ? reject(error) : resolve(output)
            )
        );
    }

    /* tslint:disable */
    /**
     * read a csv file. the return value can ONLY be used in a forEach() loop
     * e.g. readFile('abc.csv').forEach((row, index) => { console.log(row, index) })
     * @param {string} file - file path
     * @param {object} [options]
     * @param {string[]} [options.columns] - array of headers e.g ['id', 'name', ...] if defined, rows become objects instead of arrays
     * @param {number} [options.limit=0] - number of rows to read, 0 = unlimited
     * @param {string} [options.delimiter=','] - csv delimiter
     * @return {object} - { forEach: ((row, index) => void, (totalCount) => void) => void }
     */
    /* tslint:enable */
    public readFile (file: string, options: ICsvReadConfig = {}): IReadFileResponse {
        const fileStream = createReadStream(file);
        const readline = require('readline').createInterface({
            input: fileStream
        });
        return {
            forEach: (callback, endCallback) => {
                let index = 0;
                readline.on(
                    'line',
                    (line: string) => {
                        if (!options.limit || index < options.limit) {
                            ((callbackIndex) => {
                                queue(
                                    () => this.parse(line, options).then(
                                        ([row]) => callback(row, callbackIndex)
                                    )
                                );
                            })(index++);
                        } else {
                            readline.close();
                            fileStream.destroy();
                        }
                    }
                );
                readline.on('close', () => endCallback && endCallback(index));
            }
        };
    }

    /* tslint:disable */
    /**
     * @param {(array|cursor)} data - mongo cursor or array of data
     * @param {object} [options]
     * @param {string[]} [options.columns] - array of headers e.g. ['id', 'name', 'email']
     * @param {function} [options.formatter] - callback for formatting row data. It takes one row from data as parameter and should return an array e.g. (rowData) => [rowData.id, rowData.name, 'formatted data'],
     * @param {string} [options.delimiter=','] - Set the field delimiter, one character only, defaults to a comma.
     * @param {string} [options.filepath] - file path is automatically generated if empty
     * @return {promise<string>} - file path of the csv file generated
     */
    /* tslint:enable */
    public createFile (data: any[] | Cursor, options: ICsvWriteConfig = {}): Promise<string> {
        return (
            options.filepath ? Promise.resolve({path: options.filepath}) : this._generateFile({
                ...this._tmpConfig,
                keep: true,
                postfix: '.csv'
            })
        ).then(({path}) => {
            const fileStream = createWriteStream(path);
            const fileStreamPromise = new Promise((resolve, reject) => {
                fileStream.on('error', (error) => {
                    reject(error);
                });
                fileStream.on('finish', () => {
                    resolve();
                });
            });

            return (
                options.columns ? this._writeCsvStream(fileStream, options.columns, options, true) : Promise.resolve()
            ).then(
                () => new Promise((resolve, reject) => {
                    if (data instanceof Array) {
                        resolve(
                            Promise.all(
                                data.map((row) => this._writeCsvStream(fileStream, row, options))
                            )
                        );
                    } else {
                        const promises: Promise<any>[] = [];
                        data.forEach(
                            (row) => promises.push(this._writeCsvStream(fileStream, row, options)),
                            () => resolve(Promise.all(promises))
                        );
                    }
                })
            ).then(
                () => new Promise((resolve, reject) => {
                    fileStream.end(() => resolve(fileStreamPromise));
                })
            ).then(
                () => path
            );
        });
    }

    /* tslint:disable */
    /**
     * @param {stream} writableStream
     * @param {(promise|Array)} rowData
     * @param {object} options
     * @param {string[]} [options.columns] - array of headers e.g. ['id', 'name', 'email']
     * @param {function} [options.formatter] - callback for formatting row data. It takes one row from data as parameter and should return an array e.g. (rowData) => [rowData.id, rowData.name, 'formatted data'],
     * @param {string} [options.delimiter=','] - Set the field delimiter, one character only, defaults to a comma.
     * @param {string} [options.filepath] - file path is automatically generated if empty
     * @return {promise}
     * @ignore
     */
    /* tslint:enable */
    private _writeCsvStream (
        writableStream: WriteStream,
        rowData: Promise<any[]> | any[],
        options: ICsvWriteConfig,
        isHeader: boolean = false
    ): Promise<void> {
        // write onece at a time
        return queue(
            () => new Promise((resolve, reject) =>
                Promise.resolve(rowData).then( // for cursor version of findAll()
                    (data) => this._csvStringify(
                        [options.formatter && !isHeader ? options.formatter(data) : data],
                        options,
                        (error, csvRow) => error ? reject(error) : (
                            // If a call to stream.write(chunk) returns false, the 'drain' event will be emitted
                            // when it is appropriate to resume writing data to the stream.
                            writableStream.write(csvRow) ? resolve() : writableStream.once('drain', resolve)
                        )
                    )
                )
            )
        );
    }
}

export default Csv;
