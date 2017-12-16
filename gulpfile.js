'use strcit';

const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const changed = require('gulp-changed');
const merge = require('merge2');
const fs = require('fs');
const path = require('path');
// const jsdoc = require('gulp-jsdoc3');

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
    const tsResult = gulp.src('src/*.ts')
        .pipe(
            changed(distFolder, {extension: '.js'})
        )
        .pipe(sourcemaps.init()) // This means sourcemaps will be generated
        .pipe(tsProject());

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

// gulp.task('jsdoc', (done) => {
    // gulp.src(['dist/*.js'], {read: false}).pipe(
        // jsdoc(require('./jsdoc.json'), done)
    // );
// });

gulp.task('watch', ['ts-dev'], () => {
    gulp.watch('src/*.ts', ['ts']);
});
