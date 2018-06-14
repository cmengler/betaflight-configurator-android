'use strict';

const gulp = require('gulp');
const del = require('del');
const install = require('gulp-install');
const replace = require('gulp-replace');

const WWW_DIR = './www/';

gulp.task('clean-www', clean_www);

var wwwBuild = gulp.series(clean_www, www_src, www_locale, www_libraries, www_resources, www_replace);
gulp.task('www', wwwBuild);

function www_src() {
    var wwwSources = [
        './betaflight-configurator/src/**/*',
        '!./betaflight-configurator/src/css/dropdown-lists/LICENSE',
        '!./betaflight-configurator/src/css/font-awesome/css/font-awesome.css',
        '!./betaflight-configurator/src/css/opensans_webfontkit/*.{txt,html}',
        '!./betaflight-configurator/src/support/**'
    ];

    return gulp.src(wwwSources, { base: 'betaflight-configurator/src' })
        .pipe(gulp.src('betaflight-configurator/manifest.json', { passthrougth: true }))
        .pipe(gulp.src('betaflight-configurator/package.json', { passthrougth: true }))
        .pipe(gulp.src('betaflight-configurator/changelog.html', { passthrougth: true }))
        .pipe(gulp.dest(WWW_DIR))
        .pipe(install({
            npm: '--production --ignore-scripts'
        }));
}

function www_locale() {
    return gulp.src('betaflight-configurator/locales/**/*', { base: 'betaflight-configurator/locales'})
        .pipe(gulp.dest(WWW_DIR + 'i18n'));
}

function www_libraries() {
    return gulp.src('betaflight-configurator/libraries/**/*', { base: 'betaflight-configurator/libraries'})
        .pipe(gulp.dest(WWW_DIR + 'js/libraries'));
}

function www_resources() {
    return gulp.src('betaflight-configurator/resources/**/*', { base: 'betaflight-configurator/resources'})
        .pipe(gulp.dest(WWW_DIR + 'resources'));
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