/**
 * Created by qianyongjun on 16/1/14.
 */
var gulp = require('gulp');
var tp = require('@tool/gulp-template');

var html = './modules/**/*.html';
var _html = './ctrls/**/*.html';
// 合并，压缩tpl文件
gulp.task('tpl', function () {
  gulp.src(html)
    .pipe(tp())
    .pipe(gulp.dest('./modules/'));
});

gulp.task('tpl2', function () {
  gulp.src(_html)
    .pipe(tp())
    .pipe(gulp.dest('./ctrls/'));
});

gulp.task('watch', function () {
  gulp.watch(html, ['tpl', 'tpl2']);
});

gulp.task('default', ['watch', 'tpl','tpl2']);
