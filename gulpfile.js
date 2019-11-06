'use strict';

const gulp = require('gulp');
const del = require('del');
const replace = require('gulp-replace');
const fs = require('fs');

const WWW_DIR = './www/';

gulp.task('clean-www', clean_www);

var wwwBuild = gulp.series(clean_www, www_dist, www_locale, www_replace);
gulp.task('www', wwwBuild);

function www_dist() {
    var wwwSources = [
        './betaflight-configurator/dist/**/*',
        '!./betaflight-configurator/dist/css/dropdown-lists/LICENSE',
        '!./betaflight-configurator/dist/css/font-awesome/css/font-awesome.css',
        '!./betaflight-configurator/dist/css/opensans_webfontkit/*.{txt,html}',
    ];

    return gulp.src(wwwSources, { base: 'betaflight-configurator/dist' })
        .pipe(gulp.src('betaflight-configurator/changelog.html', { passthrougth: true }))
        .pipe(gulp.dest(WWW_DIR));
}

function www_locale(cb) {
    fs.renameSync(WWW_DIR + '_locales', WWW_DIR + 'i18n');
    cb();
}

function www_replace() {
    return gulp.src(WWW_DIR + 'js/**')
        .pipe(replace('chrome.serial', 'serialConnection'))
        .pipe(replace('serial.connect', 'serialConnection.connect'))
        .pipe(replace('serial.disconnect', 'serialConnection.disconnect'))
        .pipe(replace('serial.send', 'serialConnection.send'))
        .pipe(replace('serial.getDevices', 'serialConnection.getDevices'))
        .pipe(replace('serial.bitrate', 'serialConnection.bitrate'))
        .pipe(replace('serial.bytesReceived', 'serialConnection.bytesReceived'))
        .pipe(replace('serial.bytesSent', 'serialConnection.bytesSent'))
        .pipe(replace('serial.emptyOutputBuffer', 'serialConnection.emptyOutputBuffer'))
        .pipe(replace('serial.onReceive', 'serialConnection.onReceive'))
        .pipe(gulp.dest(WWW_DIR + 'js'));
}

function clean_www() {
    return del([WWW_DIR + '**'], { force: true });
}