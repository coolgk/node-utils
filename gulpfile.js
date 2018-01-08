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
const codeHeader = `/*! ${pkg.name} - ${pkg.description}
 * @version ${pkg.version}
 * @link ${pkg.homepage}
 * @license ${pkg.license}
 */

`;

gulp.task('ts', ['index.ts'], () => {
    const tsResult = gulp.src('src/*.ts')
        .pipe(
            changed(distFolder, {extension: '.js'})
        )
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

gulp.task('ts-dev', () => {
    const devTsProject = ts.createProject('./tsconfig.json', { removeComments: false });
    const tsResult = gulp.src('src/*.ts')
        .pipe(
            changed(distFolder, {extension: '.js'})
        )
        .pipe(sourcemaps.init()) // This means sourcemaps will be generated
        .pipe(devTsProject());

    return tsResult.js
            .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file
            .pipe(header('require("source-map-support").install();'))
            .pipe(gulp.dest(`${distFolder}`));
});

gulp.task('index.ts', () => {
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
    });
});

gulp.task('prepublish', ['ts'], () => {
    return new Promise((resolve) => {
        const promises = [];
        fs.readdir('dist', (error, files) => {
            files.forEach((file) => {
                promises.push(new Promise((res) => {
                    fs.rename(`dist/${file}`, `./${file}`, () => res())
                }));
            });
            resolve(Promise.all(promises));
        });
    });
});

gulp.task('postpublish', () => {
    return new Promise((resolve) => {
        const promises = [];
        fs.readdir('src', (error, files) => {
            files.forEach((file) => {
                const filename = file.replace('.ts', '');
                promises.push(
                    new Promise((res) => {
                        fs.rename(`./${filename}.js`, `dist/${filename}.js`, () => res())
                    }),
                    new Promise((res) => {
                        fs.rename(`./${filename}.d.ts`, `dist/${filename}.d.ts`, () => res())
                    })
                );
            });
            resolve(Promise.all(promises));
        });
    });
});

gulp.task('generate-package-files', ['ts-dev'], () => {
    return new Promise((resolve) => {
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

function parseFileMetaDoc (file, name) {
    return new Promise((resolve, reject) => {
        fs.readFile(`src/${file}`, 'utf8', (error, data) => {
            if (error) return reject(error);

            const [ , metaComments ] = /^\/\*\*\*\n([^]+)\n\*\//m.exec(data) || [];

            if (metaComments) {
                try {
                    const metaDoc = yaml.safeLoad(metaComments);
                    const folder = `packages/${name}`;

                    getFolder(folder).then(() => resolve(
                        Promise.all([
                            // create README.md
                            jsdoc2md.render({ files: `dist/${name}.js` }).then((jsDoc) => {

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
                                                main: `./dist/js/${name}.js`,
                                                types: `./dist/types/${name}.d.ts`,
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

function getFolder (path) {
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

// gulp.task('jsdoc', (done) => {
    // gulp.src(['dist/*.js'], {read: false}).pipe(
        // jsdoc(require('./jsdoc.json'), done)
    // );
// });

gulp.task('watch', ['ts-dev'], () => {
    gulp.watch('src/*.ts', ['ts']);
});
