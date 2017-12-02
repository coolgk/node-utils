'use strcit';

const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const changed = require('gulp-changed');
const merge = require('merge2');
const fs = require('fs');
const path = require('path');

const tsProject = ts.createProject('./tsconfig.json');

const distFolder = 'dist';

gulp.task('ts', ['index.ts'], () => {
    const tsResult = gulp.src('src/*.ts')
        .pipe(
            changed(distFolder, {extension: '.js'})
        )
        .pipe(sourcemaps.init()) // This means sourcemaps will be generated
        .pipe(tsProject());

    return merge([ // Merge the two output streams, so this task is finished when the IO of both operations is done.
        tsResult.dts.pipe(gulp.dest(`${distFolder}/types`)),
        tsResult.js
        .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file
        .pipe(gulp.dest(`${distFolder}/js`))
    ]);
});

gulp.task('index.ts', () => {
    return new Promise((resolve) => {
        const writeStream = fs.createWriteStream('src/index.ts');
        fs.readdir('src', (error, files) => {
            files.forEach((file) => {
                const filename = path.basename(file).replace('.ts', '');
                if (filename !== 'index' && filename !== 'test') {
                    const module = filename[0].toUpperCase() + filename.substr(1);
                    writeStream.write(`import * as ${filename} from './${filename}';\n`);
                    writeStream.write(`export const ${module} = ${filename};\n`);
                }
            });
            writeStream.end();
            resolve();
        });
    });
});

gulp.task('watch', ['ts'], () => {
    gulp.watch('src/*.ts', ['ts']);
});