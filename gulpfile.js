'use strcit';

const gulp = require('gulp');
const ts = require('gulp-typescript');
// var merge = require('merge2');
const sourcemaps = require('gulp-sourcemaps');

const tsProject = ts.createProject('./tsconfig.json');

gulp.task('scripts', function() {
    const tsResult = gulp.src('src/*.ts')
        .pipe(sourcemaps.init()) // This means sourcemaps will be generated
        .pipe(tsProject())
        .js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist'));

    // tsResult.js
        // .pipe(sourcemaps.write())
        // .pipe(gulp.dest('dist'));

    // return merge([ // Merge the two output streams, so this task is finished when the IO of both operations is done.
        // tsResult.dts.pipe(gulp.dest('dist/definitions')),
        // tsResult.js
        // .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file
        // .pipe(gulp.dest('dist/js'))
    // ]);
});

gulp.task('watch', ['scripts'], function() {
    gulp.watch('src/*.ts', ['scripts']);
});