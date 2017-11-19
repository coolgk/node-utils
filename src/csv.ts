'use strict';

/*
example

const csv = new CSV({
    tmp: require('../core/tmp.js')
});

return model.query('find').then((cursor) =>
    csv.createFile(
        cursor,
        {
            headers: ['column 1', 'column 2', 'column 3'],
            formatter: (row) => {
                return [row.column, row.column2, 'formatted data'];
            }
        }
    ).then((csvFilePath) => {
        console.log(csvFilePath);
        return this._downloadFile(csvFilePath, 'filename.csv');
    });
);

// {cursor: 1} below tells findAll() to return a cursor instead of an array
return model.findAll({cursor: 1}).then((result) =>
    csv.createFile(
        result.data,
        {
            headers: ['column 1', 'column 2', 'column 3'],
            formatter: (row) => {
                return [row.column, row.column2, 'formatted data'];
            }
        }
    ).then((csvFilePath) => {
        console.log(csvFilePath);
        return this._downloadFile(csvFilePath, 'filename.csv');
    });
);

const lines = csv.readFile('largeFile.csv');
lines.forEach((lineArray, index) => {
    console.log(lineArray, index);
});

const lines = csv.readFile('largeFile.csv', {headers: ['id', 'name']});
lines.forEach((lineObject, index) => {
    console.log(lineObject, index);
});

*/

// npm i -S csv-stringify @types/csv-stringify csv-parse @types/csv-parse

import { createWriteStream, createReadStream } from 'fs';
import csvStringify = require('csv-stringify');
import csvParse = require('csv-parse');
import * as tmp from './tmp';
import { blockingCall } from './blockingCall';

export interface CsvConfig {
	readonly tmp?: typeof tmp;
	readonly csvStringify?: typeof csvStringify;
	readonly csvParse?: typeof csvParse;
};

export interface CsvReadConfig {
	columns?: string[];
	limit?: number;
};

export interface CsvWriteConfig {

};

export class Csv {

	private _csvParse: typeof csvParse;
	private _csvStringify: typeof csvStringify;
	private _tmp: typeof tmp;

    /**
     * @param {object} tmp - tmp class ./core/tmp.js
     */
    constructor (options: CsvConfig = {}) {
        this._csvStringify = options.csvStringify || csvStringify;
        this._csvParse = options.csvParse || csvParse;
        this._tmp = options.tmp || tmp;

        this._writableStreamPromise = Promise.resolve();
    }

    /**
     * parse a string as csv data and returns an array
     * @param {string} string - csv string
	 * @param {object} options -
     * @param {string[]} options.columns - array of headers e.g. ['id', 'name', ...] if headers is defined, the row value will be objects
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
     * @param {string[]} options.columns - array of headers e.g. ['id', 'name', ...] if headers is defined, the row value will be objects
     * @param {number} options.limit - number of lines to return. 0 = unlimited
     * @return {function} forEach
     */
    readFile (file: string, options: CsvReadConfig = {}): {forEach: Function} {
        const fileStream = createReadStream(file);
        const readline = require('readline').createInterface({
            input: fileStream
        });
        return {
            forEach: (callback) => {
                let index = 0;
                readline.on(
                    'line',
                    (line) => {
                        if (!options.limit || index < options.limit) {
							((callbackIndex) => {
								blockingCall(
									() = > this.parse(line, options).then(
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
            }
        };
    }

    /**
     * @param {array|cursor} data - mongo cursor or array of data
     * @param {object} options
     * @param {string[]} [options.headers] - array of headers e.g. ['id', 'name', 'email']
     * @param {function} [options.formatter] - callback for formatting row data. It takes one row from data as parameter and should return an array e.g. (rowData) => [rowData.id, rowData.name, 'formatted data'],
     * @param {string} [options.delimiter=','] - Set the field delimiter, one character only, defaults to a comma.
     * @param {string} [options.filepath] - file path is automatically generated if empty
     */
    createFile (data, options = {}) {
        return (
            options.filepath ? Promise.resolve([options.filepath]) : this._tmp.generate('file', {postfix: '.csv'})
        ).then(([filepath]) => {
            const fileStream = fs.createWriteStream(filepath);

            const fileStreamPromise = new Promise((resolve, reject) => {
                fileStream.on('error', (error) => {
                    reject(error);
                });
                fileStream.on('finish', () => {
                    resolve();
                });
            });

            return (
                options.headers ? this._writeCsvStream(fileStream, options.headers, options, true) : Promise.resolve()
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
                () => filepath
            );
        });
    }

    /**
     * @param {bool} isHeader - if data is header, if header is true, options.formatter is not called on data
     */
    _writeCsvStream (writableStream, rowData, options, isHeader) {
        // write onece at a time
        return this._writableStreamPromise = this._writableStreamPromise.then(() => new Promise((resolve, reject) =>
            Promise.resolve(rowData).then( // for cursor version of findAll()
                (data) => this._csvStringify(
                    [options.formatter && !isHeader ? options.formatter(data) : data],
                    options,
                    (error, csvRow) => error ? reject(error) : (
                        writableStream.write(csvRow) ? resolve() : writableStream.once('drain', resolve)
                    )
                )
            )
        ));
    }


}
