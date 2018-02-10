'use strcit';

const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const jsdoc2md = require('jsdoc-to-markdown');
const chalk = require('chalk');
const del = require('del');
const header = require('gulp-header');

const childProcess = require('child_process');

// const changed = require('gulp-changed');
// const istanbul = require('gulp-istanbul');
// const mocha = require('gulp-mocha');
// const merge = require('merge2');
// const jsdoc = require('gulp-jsdoc3');

const packageJson = require('./package.json');
const tsProject = ts.createProject('./tsconfig.json');

const distFolder = 'dist';
const packageFolder = 'packages';

const codeHeader = `/*!
 * @package ${packageJson.name}
 * @version ${packageJson.version}
 * @link ${packageJson.homepage}
 * @license ${packageJson.license}
 */

`;

gulp.task('index.ts', generateIndexFile);

gulp.task('ts', ['index.ts'], () => {
    const tsResult = gulp.src('src/*.ts')
        // .pipe(
            // changed(distFolder, {extension: '.js'})
        // )
        // .pipe(sourcemaps.init()) // This means sourcemaps will be generated
        .pipe(tsProject());

    return merge([ // Merge the two output streams, so this task is finished when the IO of both operations is done.
        tsResult.dts
            .pipe(header(codeHeader))
            .pipe(gulp.dest(`${distFolder}`)),
        tsResult.js
            // .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file
            .pipe(header(codeHeader))
            .pipe(gulp.dest(`${distFolder}`))
    ]);
});

gulp.task('ts-dev', compileTsDev);

// gulp.task('prepublish', ['ts'], addDistCodeToPackage);

/*
gulp.task('postpublish', () => {
    return new Promise((resolve) => {
        const promises = [];
        fs.readdir('src', (error, files) => {
            files.forEach((file) => {
                const filename = file.replace('.ts', '');
                promises.push(
                    new Promise((res) => {
                        fs.rename(`./${filename}.js`, `${distFolder}/${filename}.js`, () => res())
                    }),
                    new Promise((res) => {
                        fs.rename(`./${filename}.d.ts`, `${distFolder}/${filename}.d.ts`, () => res())
                    })
                );
            });
            resolve(Promise.all(promises));
        });
    });
});
*/

gulp.task('pre-test', () => { // https://github.com/SBoudrias/gulp-istanbul
    return gulp.src([`${distFolder}/*.js`])
        .pipe(istanbul({
            // includeUntested: true
        }))
        .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], () => {
    return gulp.src('./test')
        .pipe(
            mocha({
                ui: 'bdd',
                reporter: 'spec',
                exit: true
            })
        )
        .pipe(
            istanbul.writeReports({
                dir: `./${distFolder}/coverage`,
                reporters: ['text', 'html']
            })
        )
        .pipe(
            istanbul.enforceThresholds({
                thresholds: {
                    global: 80,
                    each: 80
                }
            })
        )
        .once('error', () => {
            process.exit(1);
        });
});

gulp.task('publish', ['generate-all-packages'], () => {
    return execCommand(`cd ${packageFolder}/utils && npm publish --access=public`);
    // return new Promise((resolve) => {
        // fs.readdir(packageFolder, (error, folders) => {
            // const promises = [];
            // folders.forEach((folder) => {
                // promises.push(execCommand(`cd ${packageFolder}/${folder} && npm publish --access=public`));
            // });
            // resolve(Promise.all(promises));
        // });
    // });
});

gulp.task('dependencyCheck', ['package'], dependencyCheck);

gulp.task('generate-all-packages', ['generate-sub-packages'], generateRootPackage);
gulp.task('package', ['generate-sub-packages'], generateRootPackage);
gulp.task('generate-sub-packages', generateSubPackages);

function generateSubPackages () {
    return del([`${distFolder}/**`, `${packageFolder}/**`])
    .then(() => createFolder(packageFolder))
    .then(() => generateSubPackageMetaData())
    .then(() => generateIndexFile())
    .then(() => compileTs())
    .then(() => addDistCodeToSubPackages());
}

function compileTs () {
    const tsResult = gulp.src('src/*.ts')
        // .pipe(
            // changed(distFolder, {extension: '.js'})
        // )
        .pipe(tsProject());

    return Promise.all([
        new Promise((resolve) => {
            tsResult.dts
                .pipe(header(codeHeader))
                .pipe(gulp.dest(`${distFolder}`))
                .on('finish', () => resolve());
        }),
        new Promise((resolve) => {
            tsResult.js
                .pipe(header(codeHeader))
                .pipe(gulp.dest(`${distFolder}`))
                .on('finish', () => resolve());
        })
    ]);
}

function compileTsDev () {
    return new Promise((resolve, reject) => {
        const devTsProject = ts.createProject('./tsconfig.json', { removeComments: false });
        const tsResult = gulp.src('src/*.ts')
            // .pipe(
                // changed(distFolder, {extension: '.js'})
            // )
            .pipe(sourcemaps.init()) // This means sourcemaps will be generated
            .pipe(devTsProject());

        return tsResult.js
                .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file
                .pipe(header('require("source-map-support").install();' + "\n"))
                .pipe(gulp.dest(distFolder))
                .on('finish', () => resolve());
    });
}

function generateRootPackage () {
    const folder = `${packageFolder}/utils`;

    return createFolder(folder)
        .then(() => generateRootReadme(folder))
        .then(() => compileTs())
        .then(() => createFolder(folder))
        .then(() => {
            return new Promise((resolve) => {
                const promises = [
                    new Promise((resolve) => {
                        fs.createReadStream(`./package.json`).pipe(
                            fs.createWriteStream(`${folder}/package.json`)
                        ).on('finish', () => resolve());
                    })
                ];
                fs.readdir(distFolder, (error, files) => {
                    files.forEach((file) => {
                        promises.push(new Promise((resolve) => {
                            fs.createReadStream(`${distFolder}/${file}`).pipe(
                                fs.createWriteStream(`${folder}/${file}`)
                            ).on('finish', () => resolve());
                        }));
                    });
                    resolve(Promise.all(promises));
                });
            });
        });
}

function generateRootReadme (folder) {
    return new Promise((resolve, reject) => {
        const rootReadmeFile = `${folder}/README.md`;
        // fs.writeFile(file, '', (error) => {
            // if (error) return reject(error);
            fs.readdir('src', (error, files) => {
                const readmeWriteStream = fs.createWriteStream(rootReadmeFile);

                // travis
                readmeWriteStream.write('[![Build Status](https://travis-ci.org/coolgk/node-utils.svg?branch=master)](https://travis-ci.org/coolgk/node-utils) ');
                // dependencies
                readmeWriteStream.write('[![dependencies Status](https://david-dm.org/coolgk/node-utils/status.svg)](https://david-dm.org/coolgk/node-utils) ');
                // coverage
                readmeWriteStream.write('[![Coverage Status](https://coveralls.io/repos/github/coolgk/node-utils/badge.svg)](https://coveralls.io/github/coolgk/node-utils)');
                // security
                readmeWriteStream.write('[![Known Vulnerabilities](https://snyk.io/test/github/coolgk/node-utils/badge.svg)](https://snyk.io/test/github/coolgk/node-utils)');

                readmeWriteStream.write("\n\n");
                readmeWriteStream.write('`npm install @coolgk/utils`' + "\n\n");
                readmeWriteStream.write('you can either use the standalone modules or @coolgk/utils as an all-in-one package. To use @coolgk/utils, replace @coolgk/[module] with @coolgk/**utils**/[module] in the require() or import statements in the examples below' + "\n\n");

                const promises = [];
                files.forEach((file) => {
                    const name = file.replace('.ts', '');

                    promises.push(
                        new Promise((resolve) => {
                            fs.access(`${packageFolder}/${name}/README.md`, fs.constants.R_OK, (error) => {
                                if (error) return resolve();
                                readmeWriteStream.write(`- [${name}](#coolgk${name})\n`);

                                const rs = fs.createReadStream(`${packageFolder}/${name}/README.md`);
                                rs.on('data', (chunk) => {
                                    readmeWriteStream.write(chunk);
                                });
                                rs.on('end', () => {
                                    resolve();
                                });
                            });
                        })
                    )
                });
                Promise.all(promises).then(() => {
                    readmeWriteStream.end();
                    fs.createReadStream(rootReadmeFile).pipe(
                        fs.createWriteStream('./README.md')
                    ).on('finish', () => {
                        resolve();
                    });
                });
            });
        // });
    });
}

function generateIndexFile () {
    return new Promise((resolve) => {
        const writeStream = fs.createWriteStream('src/index.ts');
        fs.readdir('src', (error, files) => {
            files.forEach((file) => {
                const filename = file.replace('.ts', '');
                if (!['index', 'test', 'globals.d'].includes(filename)) {
                    // const module = filename[0].toUpperCase() + filename.substr(1);
                    writeStream.write(`import * as _${filename} from './${filename}';\n`);
                    writeStream.write(`export const ${filename} = _${filename}; // tslint:disable-line\n`);
                }
            });
            writeStream.end();
            resolve();
        });
    })
}

function addDistCodeToSubPackages () {
    return new Promise((resolve) => {
        const promises = [];
        fs.readdir(distFolder, (error, files) => {
            files.forEach((file) => {
                const name = file.substr(0, file.indexOf('.'));
                promises.push(new Promise((resolve) => {
                    fs.access(`${packageFolder}/${name}`, fs.constants.W_OK, (error) => {
                        if (error) {
                            console.warn(chalk.red.bold(`${name} has no package folder`));
                            return resolve();
                        }
                        fs.createReadStream(`${distFolder}/${file}`).pipe(
                            fs.createWriteStream(`${packageFolder}/${name}/${file}`)
                        ).on('finish', () => {
                            // if (file.includes('.js')) {
                                // execCommand(
                                    // `cd ${packageFolder}/${name} && sudo npm link && cd - && npm link @coolgk/${name}`,
                                    // { mute: true }
                                // );
                            // }
                            resolve();
                        });
                    });
                }));
            });
            resolve(Promise.all(promises));
        });
    });
}

function generateSubPackageMetaData () {
    return new Promise((resolve) => {
        compileTsDev().then(() => {
            fs.readdir('src', (error, files) => {
                const promises = [];
                files.forEach((file) => {
                    const name = file.replace('.ts', '');
                    if (!['index', 'test', 'globals.d'].includes(name)) {
                    // if (['array'].includes(name)) {
                        promises.push(
                            parseFileMetaDoc(file, name)
                        )
                    }
                });
                resolve(Promise.all(promises));
            });
        });
    });
}

function parseFileMetaDoc (file, name) {
    return new Promise((resolve, reject) => {
        fs.readFile(`src/${file}`, 'utf8', (error, data) => {
            if (error) return reject(error);

            const [ , metaComments ] = /^\/\*\*\*\n([^]+)\n\*\//m.exec(data) || [];

            if (metaComments) {
                try {
                    const metaDoc = yaml.safeLoad(metaComments);
                    const folder = `${packageFolder}/${name}`;

                    createFolder(folder).then(() => resolve(
                        Promise.all([
                            // create README.md
                            jsdoc2md.render({ files: `${distFolder}/${name}.js` }).then((jsDoc) => {

                                let markdown = "\n" + `## @coolgk/${name}` + "\n" +
                                'a javascript / typescript module' + "\n\n" +
                                `\`npm install @coolgk/${name}\`` + "\n\n" +
                                `${metaDoc.description}` + "\n";

                                if (metaDoc.documentation) {
                                    markdown += metaDoc.documentation;
                                }

                                if (metaDoc.example) {
                                    markdown += '## Examples' + getMdCode(metaDoc.example);
                                }

                                markdown += jsDoc;

                                // '## Docs' + "\n" +
                                // jsDoc;
                                // metaDoc.documentation;

                                return new Promise((resolve, reject) => {
                                    fs.writeFile(`${folder}/README.md`, markdown, 'utf8', (error) => {
                                        if (error) return reject(error);
                                        resolve();
                                    });
                                });
                            }),
                            // create package.json
                            new Promise((resolve, reject) => {
                                const version = metaDoc.version;
                                fs.writeFile(
                                    `${folder}/package.json`,
                                    JSON.stringify(
                                        Object.assign(
                                            packageJson,{
                                                name: `@coolgk/${name}`,
                                                main: `./${name}.js`,
                                                types: `./${name}.d.ts`,
                                                description: metaDoc.description.replace(/\n/, ' '),
                                                keywords: (metaDoc.keywords || []).concat('typescript'),
                                                dependencies: metaDoc.dependencies,
                                                devDependencies: undefined,
                                                scripts: undefined,
                                                'pre-commit': undefined,
                                                version
                                            }
                                        )
                                    ),
                                    'utf8',
                                    (error) => {
                                        if (error) return reject(error);
                                        resolve();
                                    }
                                );
                            })
                        ])
                    ));

                } catch (error) {
                    return reject(error);
                }
            } else {
                // reject(`${file} has no meta doc`);
                consoleLogError(`${file} has no meta doc`);
                resolve();
            }
        });
    });
}

function createFolder (path) {
    return new Promise((resolve, reject) => {
        fs.mkdir(path, (error) => {
            if (error && error.code !== 'EEXIST') return reject(error);
            resolve();
        });
    });
}

function getMdCode (code) {
    return "\n```javascript\n" + code + "\n```\n";
}

function dependencyCheck () {
    const promises = [];
    fs.readdir(packageFolder, (error, folders) => {
        for (const folder of folders) {
            promises.push(
                execCommand(`nsp check ${packageFolder}/${folder}`)
            );
        }
    })
    return Promise.all(promises);
}

function execCommand (command, options = {mute: false}) {
    return new Promise((resolve, reject) => {
        if (!options.mute) console.log('exec command: ' + command);
        childProcess.exec(command, {maxBuffer: Infinity}, (error, stdout, stderr) => {
            if (!options.mute) console.log(stdout);
            consoleLogError(stderr);
            if (error) {
                reject(error);
            } else {
                if (!options.mute) console.log('done');
                resolve();
            }
        });
    });
}

function consoleLogError(message) {
    console.error(chalk.white.bgRed.bold(message));
}

function unitTest (reporter = 'spec') {
    return gulp.src('./test')
        .pipe(
            mocha({
                ui: 'bdd',
                reporter: reporter,
                exit: true
            })
        )
        .pipe(
            istanbul.writeReports({
                dir: `./${distFolder}/coverage`,
                reporters: ['text', 'html']
            })
        )
        .pipe(
            istanbul.enforceThresholds({
                thresholds: {
                    global: 80,
                    each: 80
                }
            })
        )
        .once('error', () => {
            process.exit(1);
        });
}

process.on('unhandledRejection', consoleLogError);

gulp.task('watch', ['ts-dev'], () => {
    gulp.watch('src/*.ts', ['ts-dev']);
});
