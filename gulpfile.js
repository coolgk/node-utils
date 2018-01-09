'use strcit';

const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const changed = require('gulp-changed');
const merge = require('merge2');
const fs = require('fs');
const path = require('path');
// const jsdoc = require('gulp-jsdoc3');
const yaml = require('js-yaml');
const jsdoc2md = require('jsdoc-to-markdown');
const chalk = require('chalk');

const packageJson = require('./package.json');

const tsProject = ts.createProject('./tsconfig.json');
const distFolder = 'dist';

const header = require('gulp-header');
const pkg = require('./package.json');
const codeHeader = `/*!
 * @package ${pkg.name}
 * @version ${pkg.version}
 * @link ${pkg.homepage}
 * @license ${pkg.license}
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

gulp.task('generate-all-packages', ['generate-sub-packages'], generateRootPackage);
gulp.task('generate-root-package', ['generate-sub-packages'], generateRootPackage);
gulp.task('generate-sub-packages', generateSubPackages);

function generateSubPackages () {
    return generateSubPackageMetaData()
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
                .pipe(header('require("source-map-support").install();'))
                .pipe(gulp.dest(distFolder))
                .on('finish', () => resolve());
    });
}

function generateRootPackage () {
    const folder = 'packages/utils';

    return generateRootReadme(folder);

    return compileTs()
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
    return new Promise((resolve) => {
        const file = `${folder}/README.md`;
        fs.writeFile(file, '', () => {
            fs.readdir('src', (error, files) => {
                const readmeStream = fs.createWriteStream(file);
                const promises = [];
                files.forEach((file) => {
                    const name = file.replace('.ts', '');
                    promises.push(
                        new Promise((resolve) => {
                            fs.access(`packages/${name}/README.md`, fs.constants.R_OK, (error) => {
                                if (error) return resolve();
                                const rs = fs.createReadStream(`packages/${name}/README.md`);
                                rs.on('data', (chunk) => {
                                    readmeStream.write(chunk);
                                });
                                rs.on('end', () => {
                                    resolve();
                                });
                            });
                        })
                    )
                });
                resolve(Promise.all(promises).then(() => {
                    readmeStream.end();
                }));
            });
        });
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
                    fs.access(`packages/${name}`, fs.constants.W_OK, (error) => {
                        if (error) {
                            console.warn(chalk.red.bold(`${name} has no package folder`));
                            return resolve();
                        }
                        fs.createReadStream(`${distFolder}/${file}`).pipe(
                            fs.createWriteStream(`packages/${name}/${file}`)
                        ).on('finish', () => resolve());
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
                    const folder = `packages/${name}`;

                    createFolder(folder).then(() => resolve(
                        Promise.all([
                            // create README.md
                            jsdoc2md.render({ files: `${distFolder}/${name}.js` }).then((jsDoc) => {

                                const markdown = `# npm install @coolgk/${name}` + '\n' +
                                `${metaDoc.description}` + "\n" +
                                '## Examples' +
                                getMdCode(metaDoc.example) +
                                '## Docs' + "\n" +
                                jsDoc;
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
                                fs.writeFile(
                                    `${folder}/package.json`,
                                    JSON.stringify(
                                        Object.assign(
                                            packageJson,{
                                                name: `@coolgk/${name}`,
                                                main: `./${distFolder}/${name}.js`,
                                                types: `./${distFolder}/${name}.d.ts`,
                                                description: metaDoc.description,
                                                keywords: metaDoc.keywords,
                                                dependencies: metaDoc.dependencies,
                                                devDependencies: undefined,
                                                scripts: undefined
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
                console.error(chalk.white.bgRed.bold(`${file} has no meta doc`));
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

gulp.task('watch', ['ts-dev'], () => {
    gulp.watch('src/*.ts', ['ts']);
});
