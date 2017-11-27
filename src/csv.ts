/*
example

import { CsvConfig, CsvReadConfig, CsvWriteConfig, Csv } from './csv';

const csv = new Csv({
    tmpConfig: { // optional
        dir: '/tmp/csv'
    }
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
        formatter: (row: any[]) => {
            return row.map((value) => 'formatted-' + value);
        }
    }
).then((csvFilePath) => {
    console.log(csvFilePath);
    read(csvFilePath, ['column 1', 'column 2', 'column 3', 'h4', 'h5']);
});

csv.createFile(
    objectData,
    {
        columns: ['col1', 'col2', 'col3'],
        formatter: (row: {[propName: string]: any}) => {
            return [row.col1 + '+format', row.col2 + '+format', row.col3 + '+format'];
        }
    }
).then((csvFilePath) => {
    console.log(csvFilePath);
    read(csvFilePath, ['col1', 'col2', 'col3']);
});

function read (file, columns) {
    // with columns/headers
    const lines = csv.readFile(file, {columns: columns});
    lines.forEach(
        (lineArray, index) => {
            console.log(lineArray, index);
        },
        (total) => {
            console.log('read done, total:', total);
        }
    );

    // without columns/headers
    const lines2 = csv.readFile(file);
    lines2.forEach(
        (lineArray, index) => {
            console.log(lineArray, index);
        },
        (total) => {
            console.log('read done, total:', total);
        }
    );
}
*/

// npm i -S csv-stringify @types/csv-stringify csv-parse @types/csv-parse @types/mongodb

import { createWriteStream, createReadStream, WriteStream } from 'fs';
import csvStringify = require('csv-stringify');
import csvParse = require('csv-parse');
import { generateFile, TmpConfig } from './tmp';
import { queue } from './queue';
import { Cursor } from 'mongodb';

export interface CsvConfig {
    readonly generateFile?: typeof generateFile;
    readonly csvStringify?: typeof csvStringify;
    readonly csvParse?: typeof csvParse;
    readonly tmpConfig?: TmpConfig;
};

export interface CsvReadConfig {
    columns?: string[];
    limit?: number;
    delimiter?: string;
};

export interface CsvWriteConfig {
    columns?: string[];
    delimiter?: string;
    filepath?: string;
    formatter?: (data: {[propName: string]: any} | any[]) => string[];
};

export interface ReadFileResponse {
    forEach: (
        callback: (row: any, index: number) => void,
        endCallback: (rowCount: number) => void
    ) => void;
}

export class Csv {

    private _csvParse: typeof csvParse;
    private _csvStringify: typeof csvStringify;
    private _generateFile: typeof generateFile;
    private _tmpConfig: TmpConfig;

    /**
     * @param {object} options
     * @param {function} [options.generateFile] - generateFile function from ./tmp
     * @param {function} [options.csvStringify] - require('csv-stringify')
     * @param {function} [options.csvParse] - require('csv-parse')
     * @param {object} [options.tmpConfig] - see generate() in ./tmp
     */
    constructor (options: CsvConfig = {}) {
        this._csvStringify = options.csvStringify || csvStringify;
        this._csvParse = options.csvParse || csvParse;
        this._generateFile = options.generateFile || generateFile;
        this._tmpConfig = options.tmpConfig || {};
    }

    /**
     * parse a string as csv data and returns an array
     * @param {string} string - csv string
     * @param {object} options
     * @param {string[]} [options.columns] - array of headers e.g. ['id', 'name', ...] if headers is defined, the row value will be objects
     * @param {number} [options.limit=0] - number of rows to read, 0 = unlimited
     * @param {string} [options.delimiter=','] - csv delimiter
     * @return {promise}
     */
    parse (string: string, options: CsvReadConfig = {}): Promise<any[]> {
        return new Promise(
            (resolve, reject) => this._csvParse(string, options, (error, output) => error ? reject(error) : resolve(output))
        );
    }

    /**
     * read a csv file. the return value can ONLY be used in a forEach() loop
     * e.g. readFile('abc.csv').forEach((row, index) => { console.log(row, index) })
     * @param {string} file - file path
     * @param {object} options
     * @param {string[]} [options.columns] - array of headers e.g. ['id', 'name', ...] if headers is defined, the row value will be objects
     * @param {number} [options.limit=0] - number of rows to read, 0 = unlimited
     * @param {string} [options.delimiter=','] - csv delimiter
     * @return {object} { forEach: ((row, index) => void, (totalCount) => void) => void }
     */
    readFile (file: string, options: CsvReadConfig = {}): ReadFileResponse {
        const fileStream = createReadStream(file);
        const readline = require('readline').createInterface({
            input: fileStream
        });
        return {
            forEach: (callback, endCallback) => {
                let index = 0;
                readline.on(
                    'line',
                    (line) => {
                        if (!options.limit || index < options.limit) {
                            ((callbackIndex) => {
                                queue(
                                    () => this.parse(line, options).then(
                                        ([row]) => callback(row, callbackIndex)
                                    )
                                );
                            })(index++)
                        } else {
                            readline.close();
                            fileStream.destroy();
                        }
                    }
                );
                readline.on('close', () => endCallback(index));
            }
        };
    }

    /**
     * @param {array|cursor} data - mongo cursor or array of data
     * @param {object} options
     * @param {string[]} [options.columns] - array of headers e.g. ['id', 'name', 'email']
     * @param {function} [options.formatter] - callback for formatting row data. It takes one row from data as parameter and should return an array e.g. (rowData) => [rowData.id, rowData.name, 'formatted data'],
     * @param {string} [options.delimiter=','] - Set the field delimiter, one character only, defaults to a comma.
     * @param {string} [options.filepath] - file path is automatically generated if empty
     * @return {promise}
     */
    createFile (data: any[] | Cursor, options: CsvWriteConfig = {}): Promise<string> {
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
                        const promises = [];
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

    /**
     * @param {stream} writableStream
     * @param {promise|*[]} rowData
     * @param {object} options
     * @param {string[]} [options.columns] - array of headers e.g. ['id', 'name', 'email']
     * @param {function} [options.formatter] - callback for formatting row data. It takes one row from data as parameter and should return an array e.g. (rowData) => [rowData.id, rowData.name, 'formatted data'],
     * @param {string} [options.delimiter=','] - Set the field delimiter, one character only, defaults to a comma.
     * @param {string} [options.filepath] - file path is automatically generated if empty
     * @return {promise}
     */
    private _writeCsvStream (
        writableStream: WriteStream, rowData: Promise<any[]> | any[], options: CsvWriteConfig, isHeader: boolean = false
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
