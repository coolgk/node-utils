import { tmpdir } from 'os';
import * as Busboy from 'busboy';
import { createWriteStream } from 'fs';
import { generateFile } from './tmp';

function formData (request) {
    return (fieldNames, options = {folder: tmpdir()}) => {
        return new Promise((resolve, reject) => {
            if (request.headers['content-type']) {
                console.log(request.headers['content-type']);
                if (request.headers['content-type'] === 'application/json') {
                    const data = [];
                    request.on('data', (chunk) => data.push(chunk));
                    request.on('end', () => {
                        try {
                            resolve(JSON.parse(Buffer.concat(data).toString()))
                        } catch (error) {
                            reject(error);
                        }
                    });
                } else if (
                    request.headers['content-type'].indexOf('multipart/form-data') === 0
                    || request.headers['content-type'] === 'application/x-www-form-urlencoded'
                ) {
                    const busboy = new Busboy({ headers: request.headers, limits: options.limits});
                    const data = {};
                    busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
                        if (fieldNames.includes(fieldname)) {
                            if (!data[fieldname]) {
                                data[fieldname] = [];
                            }

                            const { path } = await generateFile({dir: options.folder, postfix: '', keep: true});
                            const writeableStream = createWriteStream(path);

                            let filesize = 0;
                            file.on('data', (chunk) => {
                                filesize += chunk.length;
                                writeableStream.write(chunk);
                            });

                            file.on('end', () => {
                                writeableStream.end();
                                data[fieldname].push({
                                    name: filename,
                                    encoding,
                                    mimetype,
                                    size: filesize,
                                    path: path
                                });
                            });
                        } else {
                            file.resume();
                        }
                    });

                    busboy.on('field', (fieldname, value) => {
                        if (fieldNames.includes(fieldname)) {
                            if (!data[fieldname]) {
                                data[fieldname] = [];
                            }
                            data[fieldname].push(value);
                        }
                    });

                    busboy.on('finish', () => {
                        resolve(data);
                    });

                    request.pipe(busboy);
                } else {
                    resolve({});
                }
            }
        });
    }
}
