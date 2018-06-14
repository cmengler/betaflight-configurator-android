# Betaflight - Configurator for Android
[![GPL-3.0 license](https://img.shields.io/badge/license-GPL--3-blue.svg)](https://github.com/cmengler/betaflight-configurator-android/blob/master/LICENSE) ![Built with Cordova](https://img.shields.io/badge/built_with-Cordova-4CC2E4.svg) ![Betaflight Configurator Version](https://img.shields.io/badge/configurator-10.3.0-yellow.svg) ![Status](https://img.shields.io/badge/status-development-red.svg)


### This project uses Apache Cordova to build a version of the Betaflight Configurator to run on Android devices with USB On-The-Go (OTG) capabilities.

This Android version is only suitable for large device screens such as tablets in landscape mode.

This is a work-in-progress -- please be aware that functionality of the desktop Betaflight Configurator may not work as intended in this version.

## Prerequisites
* [Android SDK](https://developer.android.com/)
* [Node.js](https://nodejs.org/)

## Build
```bash
git submodule update --init
npm install
./node_modules/gulp/bin/gulp.js www
cordova prepare
cordova build android --debug
```
This will generate the following Android APK file platforms/android/build/outputs/apk/armv7/debug/android-armv7-debug.apk

## Debugging
1. Connect the device via USB to your development machine.
2. Open Chrome -> Developer Tools (F12) -> More tools -> Remove Devices.
3. Under the development device, click the Inspect button on the WebView. Console logs will be visible in this session.

### ADB
Android Debug Bridge (adb) is a command-line tool that lets you communicate with an Android device. It's particularly useful for quickly uploading and installing APK's to the device. `adb` is included in the Android SDK [platform-tools](https://developer.android.com/studio/releases/platform-tools) package.

```bash
adb install -r platforms/android/build/outputs/apk/armv7/debug/android-armv7-debug.apk
```

## Notes
* `_locales` directory is renamed to `i18n` due to an Android [issue](https://issues.apache.org/jira/browse/CB-8245) with directories starting with underscores
* TCP support `tcp://[IP]:[PORT]` has not been **tested**

## Known issues
* CLI output doesn't show all data when "dump" is requested
* Firmware tab intentionally hidden

## Roadmap
* Propose changes to [Betaflight Configurator](https://github.com/betaflight/betaflight-configurator) HTML/CSS to be responsive for smaller screens
* Revise serial support (e.g. create chrome.serial plugin for Cordova) to remove necessity to override [Betaflight Configurator](https://github.com/betaflight/betaflight-configurator) core JavaScript files in `merges`
* iOS support using WiFi